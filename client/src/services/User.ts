import config from "../config/index";
import { StatusCodes } from "http-status-codes";
import api from "../utils/Api";
import { UserType } from "../context/UserContext";

class UserService {
    static async getUser(): Promise<UserType> {
        const response = await api.get(config.user.uri);
        if (response.status === StatusCodes.OK) {
            return response.data;
        } else {
            throw Error(`Failed to get user information: ${response.statusText}`);
        }
    }
}

export default UserService;