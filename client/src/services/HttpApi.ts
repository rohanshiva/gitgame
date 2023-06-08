import axios from "axios";
import config from "../config";
import { User } from "../Interface";

const instance = axios.create({
  baseURL: config.baseUri,
  withCredentials: true,
});

async function makeFeedback(feedback: string) {
  await instance.post(config.feedback.uri, {
    message: feedback,
  });
}

async function makeSession(): Promise<string> {
  const response = await instance.post(config.make.uri);
  return response.data.id;
}

async function getUser(): Promise<User> {
  const response = await instance.get(config.user.uri);
  return response.data;
}

export default {
  makeFeedback,
  makeSession,
  getUser,
};
