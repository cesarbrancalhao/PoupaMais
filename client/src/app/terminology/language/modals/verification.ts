export const verificationModal = {
  title: {
    pt: 'Verificar Email',
    en: 'Verify Email',
    es: 'Verificar Correo Electrónico',
  },

  description: {
    pt: 'Digite o código de 6 dígitos que enviamos para',
    en: 'Enter the 6-digit code we sent to',
    es: 'Ingrese el código de 6 dígitos que enviamos a',
  },
  codePlaceholder: {
    pt: 'Digite o código',
    en: 'Enter code',
    es: 'Ingrese el código',
  },

  verify: {
    pt: 'Verificar',
    en: 'Verify',
    es: 'Verificar',
  },
  verifying: {
    pt: 'Verificando...',
    en: 'Verifying...',
    es: 'Verificando...',
  },
  resendCode: {
    pt: 'Reenviar código',
    en: 'Resend code',
    es: 'Reenviar código',
  },

  invalidCode: {
    pt: 'Código inválido',
    en: 'Invalid code',
    es: 'Código inválido',
  },
  expiredCode: {
    pt: 'Código expirado. Solicite um novo código.',
    en: 'Code expired. Request a new code.',
    es: 'Código expirado. Solicite un nuevo código.',
  },
  tooManyAttempts: {
    pt: 'Muitas tentativas inválidas. Solicite um novo código.',
    en: 'Too many invalid attempts. Request a new code.',
    es: 'Demasiados intentos inválidos. Solicite un nuevo código.',
  },
  codeRequired: {
    pt: 'Código é obrigatório',
    en: 'Code is required',
    es: 'El código es obligatorio',
  },

  verified: {
    pt: 'Email verificado com sucesso!',
    en: 'Email verified successfully!',
    es: '¡Correo electrónico verificado exitosamente!',
  },
  codeSent: {
    pt: 'Novo código enviado!',
    en: 'New code sent!',
    es: '¡Nuevo código enviado!',
  },

  checkSpam: {
    pt: 'Não recebeu o código? Verifique sua pasta de spam.',
    en: 'Didn\'t receive the code? Check your spam folder.',
    es: '¿No recibió el código? Revise su carpeta de spam.',
  },
  expiresIn: {
    pt: 'O código expira em 15 minutos.',
    en: 'The code expires in 15 minutes.',
    es: 'El código expira en 15 minutos.',
  },
} as const;
