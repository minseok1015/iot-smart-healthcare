import json
import pymysql
import boto3
import os

# MQTT publish client
iot_client = boto3.client('iot-data', region_name='eu-north-1')

# RDS 접속 설정
rds_config = { // 본인 정보 사용할 것
    "host": "Host",
    "user": "user",
    "password": "password ",
    "db": "db",
    "charset": "utf8"
}

# 오차 기준
TEMP_MARGIN = 2.0
HUMIDITY_MARGIN = 5.0

def lambda_handler(event, context):
    try:
        payload = json.loads(event['payload'])  # IoT Core에서 전달됨
        temperature = payload['temperature']
        humidity = payload['humidity']
        user_id = payload['user_id']
        timestamp = payload.get('timestamp')

    except (KeyError, json.JSONDecodeError):
        return {
            'statusCode': 400,
            'body': 'Missing or malformed required fields.'
        }

    # RDS 연결
    conn = pymysql.connect(**rds_config)
    try:
        with conn.cursor() as cursor:
            # 1. 환경 데이터 저장
            cursor.execute("""
                INSERT INTO EnvironmentData (user_id, temperature, humidity, recorded_at)
                VALUES (%s, %s, %s, %s)
            """, (user_id, temperature, humidity, timestamp))
            conn.commit()

            # 2. 최적값 조회
            cursor.execute("""
                SELECT target_temperature, target_humidity
                FROM OptimalCondition
                WHERE user_id = %s
            """, (user_id,))
            result = cursor.fetchone()

            if not result:
                print("❗ 최적 조건 없음")
                return {'statusCode': 404, 'body': 'No optimal condition found'}

            optimal_temp, optimal_humid = result

            control_msgs = []

            # 온도 비교
            if temperature > optimal_temp + TEMP_MARGIN:
                control_msgs.append({"device": "aircon", "action": "on"})
            elif temperature < optimal_temp - TEMP_MARGIN:
                control_msgs.append({"device": "heater", "action": "on"})

            # 습도 비교
            if humidity > optimal_humid + HUMIDITY_MARGIN:
                control_msgs.append({"device": "dehumidifier", "action": "on"})
            elif humidity < optimal_humid - HUMIDITY_MARGIN:
                control_msgs.append({"device": "humidifier", "action": "on"})

            # 3. 제어 메시지 MQTT publish
            for msg in control_msgs:
                iot_client.publish(
                    topic="/device/control",
                    qos=1,
                    payload=json.dumps(msg)
                )

            return {
                'statusCode': 200,
                'body': f"Stored data. {len(control_msgs)} control message(s) published."
            }

    finally:
        conn.close()
