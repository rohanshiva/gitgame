import config from "../config/index";
import { StatusCodes } from "http-status-codes";
import api from "../utils/Api";

class SessionService {
  static async makeSession(): Promise<string> {
    const response = await api.post(config.make.uri);
    if (response.status === StatusCodes.CREATED) {
      return response.data.id;
    } else {
      throw Error(`Failed to make session: ${response.statusText}`);
    }
  }
}

export default SessionService;
