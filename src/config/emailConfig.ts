type emailConfig = {
  USER: string
  PASS: string
  SERVICE: string
  HOST: string
}

const emailConfig: emailConfig = {
  USER: process.env.EMAIL_USER,
  PASS: process.env.EMAIL_PASS,
  SERVICE: process.env.EMAIL_SERVICE,
  HOST: process.env.EMAIL_HOST
}

export default emailConfig
