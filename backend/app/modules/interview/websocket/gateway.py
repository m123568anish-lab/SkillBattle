from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.modules.interview.services.interview_service import (
    interview_service,
)


class InterviewGateway:

    async def handle(

        self,

        websocket: WebSocket,

        session_id: str,

    ):

        await websocket.accept()

        try:

            while True:

                message = await websocket.receive_json()

                result = (

                    interview_service.answer(

                        session_id,

                        message["answer"],

                    )

                )

                await websocket.send_json(

                    result,

                )

        except WebSocketDisconnect:

            return


interview_gateway = InterviewGateway()