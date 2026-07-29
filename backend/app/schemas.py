from pydantic import BaseModel, Field


class GenerateMessageRequest(BaseModel):
    situation: str = Field(..., examples=["mri"])
    age: str = Field(..., examples=["adult"])
    religion: str = Field(default="none", examples=["none"])
    duration: str = Field(..., examples=["5"])
    anxiety: str = Field(default="low", examples=["low"])


class GenerateMessageResponse(BaseModel):
    message: str
