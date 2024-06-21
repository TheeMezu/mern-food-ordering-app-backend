import express from "express";
import multer from "multer";
import MyRestaurantController from "../controllers/MyRestaurantController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyRestaurantRequest } from "../middleware/validation";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, //5mb is the maxFile size
    },
});

router.get(
    "/order", 
    jwtCheck, 
    jwtParse, 
    MyRestaurantController.getMyRestaurantOrders)


// patch usually used for updating only a small thing but put is when updating 
// the entire thing
router.patch(
    "/order/:orderId/status",
    jwtCheck,
    jwtParse,
    MyRestaurantController.updateOrderStatus);


// this will check the request body for a property called imageFile which
// multer will save it to memory and use multer for validation, it will then
// append an image function 
router.post(
    "/",
    upload.single("imageFile"),
    validateMyRestaurantRequest,
    jwtCheck,
    jwtParse,
    MyRestaurantController.createMyRestaurant
);


router.put("/",
    upload.single("imageFile"),
    validateMyRestaurantRequest,
    jwtCheck,
    jwtParse, MyRestaurantController.updateMyRestaurant)


router.get("/", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurant)


export default router