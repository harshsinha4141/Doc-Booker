import jwt from "jsonwebtoken";
const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER:", authHeader); // 👈 DEBUG

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized. Login Again." });
    }

    const token = authHeader.split(" ")[1];


    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.body.userId = decoded.id;
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.log("JWT error:", error.message); // 👈 SHOW ERROR MESSAGE
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
export default authUser;
