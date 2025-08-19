import axios from "axios"

let accessToken = ''
let refreshToken = ''

export const getAccessToken = async () => {
  if (!accessToken) {
    await login()
  }
  return accessToken
}

const login = async () => {
  try {
    const response = await axios.post(
      'http://10.129.180.161:36560/api3/v1/Auth/login',
      new URLSearchParams({
        username: 'middleware_dev',
        password: 'DevMH@2025!'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    
    accessToken = response.data.access_token
    refreshToken = response.data.refresh_token
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

export const refreshAuthToken = async () => {
  try {
    const response = await axios.post(
      'http://10.129.180.161:36560/api3/v1/Auth/refresh',
      new URLSearchParams({
        refreshToken
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    
    accessToken = response.data.access_token
    refreshToken = response.data.refresh_token
  } catch (error) {
    console.error('Token refresh error:', error)
    await login()
  }
}