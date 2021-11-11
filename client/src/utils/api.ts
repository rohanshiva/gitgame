import axios from "axios";
import config from "../config";

axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);


// export async function get(url) {
//   return await fetch(`${config.baseUri}/${url}`);
// }

// export async function post(url, data) {
//   return await fetch(`${config.baseUri}/${url}`, {
//     method: "POST",
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//     },
//     body: JSON.stringify(data),
//   });
// }

export function get(url) {
  return axios.get(`${config.baseUri}/${url}`);
}

export function post(url, data) {
  return axios.post(`${config.baseUri}/${url}`, data);
}