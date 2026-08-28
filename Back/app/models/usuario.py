from typing import Literal

from pydantic import BaseModel, EmailStr

# D1 (rectificar_verificar.md): para P0 el Estado y la Entidad de Respuesta se
# fusionan en un solo rol con permisos combinados (panel consolidado + vincularse
# a necesidades + reportar avance). Separarlos queda como P1.
Rol = Literal["damnificado", "donante", "empresa_beneficiaria", "estado_entidad_respuesta"]


class Usuario(BaseModel):
    uid: str
    rol: Rol
    nombre: str
    email: EmailStr
