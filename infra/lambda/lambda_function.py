import json
import os
import urllib.request

DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]


def lambda_handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    alarm_name = message.get("AlarmName", "")
    state = message.get("NewStateValue", "")
    reason = message.get("NewStateReason", "")
    timestamp = message.get("StateChangeTime", "")

    color = 0xFF0000 if state == "ALARM" else 0x00FF00

    payload = {
        "embeds": [{
            "title": f"{'🚨' if state == 'ALARM' else '✅'} {alarm_name}",
            "description": reason,
            "color": color,
            "fields": [
                {"name": "상태", "value": state, "inline": True},
                {"name": "시간", "value": timestamp, "inline": True}
            ]
        }]
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DISCORD_WEBHOOK,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    urllib.request.urlopen(req)
