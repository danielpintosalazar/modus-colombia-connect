from typing import Literal

from pydantic import BaseModel, EmailStr

Rol = Literal["damnificado", "donante", "empresa_beneficiaria", "entidad_respuesta", "estado"]


class Usuario(BaseModel):
    uid: str
    rol: Rol
    nombre: str
    email: EmailStr
