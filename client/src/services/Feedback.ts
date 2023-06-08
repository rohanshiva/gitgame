import config from "../config/index";
import { StatusCodes } from "http-status-codes";
import api from "../utils/Api";

class FeedbackService {
  static async makeFeedback(feedback: string) {
    const response = await api.post(config.feedback.uri, {
      message: feedback,
    });
    if (response.status !== StatusCodes.CREATED) {
      throw Error(`Failed to provide feedback: ${response.statusText}`);
    }
  }
}

export default FeedbackService;
