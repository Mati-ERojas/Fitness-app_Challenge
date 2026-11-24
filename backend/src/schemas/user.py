from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    terms_accepted: bool = Field(..., description="Must accept terms and conditions")

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("The field cannot be empty or whitespace")
        return value

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must accept the terms and conditions")
        return value


class UserCreate(UserBase):
    password: str = Field(..., min_length=12, max_length=128)


class UserResponse(UserBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


