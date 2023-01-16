import { useRef, useState } from "react";
import { Chunk } from "../../interfaces/Chunk";
import { Comment, Lines } from "../../interfaces/Comment";
import Comments from "../comments";
import Editor from "../editor";
import "./Playground.css";
const chunk = {
    filename: "drone_camera_observer.cpp",
    extension: "cpp",
    lines: [
        {
            line_number: 0,
            content: '#include "./drone_camera_observer.h"',
        },
        {
            line_number: 1,
            content: "",
        },
        {
            line_number: 2,
            content: "// Constructor",
        },
        {
            line_number: 3,
            content:
                "DroneCameraObserver::DroneCameraObserver(int camera_id, ICameraController *controller) : id_(camera_id), controller_(controller)",
        },
        {
            line_number: 4,
            content: "{",
        },
        {
            line_number: 5,
            content: "    controller_->AddObserver(*this);",
        },
        {
            line_number: 6,
            content: "}",
        },
        {
            line_number: 7,
            content: "",
        },
        {
            line_number: 8,
            content: "void DroneCameraObserver::TakePicture()",
        },
        {
            line_number: 9,
            content: "{",
        },
        {
            line_number: 10,
            content: "    controller_->TakePicture(id_);",
        },
        {
            line_number: 11,
            content: "}",
        },
        {
            line_number: 12,
            content: "",
        },
        {
            line_number: 13,
            content:
                "// Processes images asynchonously.  The returned camera result will be passed into the ImageProcessingComplete(...) method",
        },
        {
            line_number: 14,
            content:
                "ICameraResult *DroneCameraObserver::ProcessImages(int camera_id, double x_pos,",
        },
        {
            line_number: 15,
            content:
                "                                                  double y_pos, double z_pos, const std::vector<RawCameraImage> &images, picojson::object &details) const",
        },
        {
            line_number: 16,
            content: "{",
        },
        {
            line_number: 17,
            content: "    if (camera_id == id_ || camera_id < 0)",
        },
        {
            line_number: 18,
            content: "    {",
        },
        {
            line_number: 19,
            content:
                "        // These will output the image to files.  Ultimately this is just for debugging:",
        },
        {
            line_number: 20,
            content: "",
        },
        {
            line_number: 21,
            content: "        /*",
        },
        {
            line_number: 22,
            content:
                '        std::ofstream color_file("color.jpg", std::ios::out | std::ios::binary);',
        },
        {
            line_number: 23,
            content:
                "        color_file.write(reinterpret_cast<const char *>(images[0].data), images[0].length);",
        },
        {
            line_number: 24,
            content:
                '        std::ofstream depth_file("depth.jpg", std::ios::out | std::ios::binary);',
        },
        {
            line_number: 25,
            content:
                "        depth_file.write(reinterpret_cast<const char *>(images[1].data), images[1].length);",
        },
        {
            line_number: 26,
            content: "        */",
        },
        {
            line_number: 27,
            content: "",
        },
        {
            line_number: 28,
            content: "        // read camera image as Image object",
        },
        {
            line_number: 29,
            content:
                "        Image drone_camera_image = Image((const unsigned char *)images[0].data, images[0].length);",
        },
        {
            line_number: 30,
            content:
                "        Image depth_image = Image((const unsigned char *)images[1].data, images[1].length);",
        },
        {
            line_number: 31,
            content: "",
        },
        {
            line_number: 32,
            content: "        // run robot_detector on the drome camera image",
        },
        {
            line_number: 33,
            content: "        std::vector<Image *> detector_inputs;",
        },
        {
            line_number: 34,
            content: "        detector_inputs.push_back(&drone_camera_image);",
        },
        {
            line_number: 35,
            content: "        detector_inputs.push_back(&depth_image);",
        },
        {
            line_number: 36,
            content: "",
        },
        {
            line_number: 37,
            content: "        RobotDetector robot_detector = RobotDetector();",
        },
        {
            line_number: 38,
            content:
                "        CameraResult robot_detector_result = robot_detector.Detect(detector_inputs, Vector3(x_pos, y_pos, z_pos));",
        },
        {
            line_number: 39,
            content: "        ",
        },
        {
            line_number: 40,
            content:
                "        // populate result of checking if the robot existed in the images",
        },
        {
            line_number: 41,
            content: "        CameraResult *result = new CameraResult();",
        },
        {
            line_number: 42,
            content: "        result->found = robot_detector_result.found;",
        },
    ],
} as Chunk;

// const Players = ["ramko9999", "rohanshiva", "TanushN", "rabingaire", "IronClad8055"]

const Help = () => {
    return (
        <div className="help">
            <div className="step">
                <div className="step-header">Step 1️</div>
                <div>Click on any line number</div>
            </div>
            <div className="step">
                <div className="step-header">Step 2</div>
                <div>
                    Hold <kbd>shift</kbd> and click on any line number below or above the
                    previously clicked line, to select a group of lines
                </div>
            </div>
            <div className="step">
                <div className="step-header">Step 3️</div>
                <div>
                    Click on the <kbd>...</kbd> next to the selected line number. (popover
                    should appear)
                </div>
            </div>
            <div className="step">
                <div className="step-header">Step 4️</div>
                <div>Type your comment in the popover texarea</div>
            </div>
            <div className="step">
                <div className="step-header">Step 5️</div>
                <div>
                    If you don't like something, submit a 💩 comment by clicking on 💩
                </div>
            </div>
            <div className="step">
                <div className="step-header">Step 6️</div>
                <div>If you like something, submit a 💎 by clicking on 💎</div>
            </div>
            <div className="step">
                <div className="step-header">Step 7️</div>
                <div>Cancel line selection by clicking on ❌</div>
            </div>
        </div>
    );
};

export const Playground = () => {
    const [showHelp, setShowHelp] = useState<boolean>(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [focusLines, setFocusLines] = useState<Lines | undefined>(undefined);

    const addComment = (comment: Comment) => {
        setComments((prevComments) => [...prevComments, comment]);
    };

    return (
        <>
            <div className="top">
                <a href="https://github.com/rohanshiva/gitgame">
                    github.com/rohanshiva/gitgame
                </a>
                <div className="top-btns">
                    <button>Next</button>
                    <button onClick={() => setShowHelp((v) => !v)}>
                        {showHelp ? "Comments" : "Help"}
                    </button>
                </div>
            </div>
            <div className="container">
                <Editor chunk={chunk} addComment={addComment} focusLines={focusLines} />
                {showHelp ? <Help /> : <Comments comments={comments} setFocusLines={setFocusLines}/>}
            </div>
        </>
    );
};

export default Playground;
