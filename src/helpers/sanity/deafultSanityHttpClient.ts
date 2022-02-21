import axios from 'axios'

export const defaultSanityHttpClient = axios.create({
  baseURL: 'https://api.sanity.io/v2022-02-06',
})
