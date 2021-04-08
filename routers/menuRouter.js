const express = require("express");
const menuRouter = express.Router();
const jwt = require("jsonwebtoken");
const { Category } = require("../schemas/Category");
const { Menu } = require("../schemas/Menu");
const { Mymenu } = require("../schemas/Mymenu");
const { UserHistory } = require("../schemas/UserHistory");
const { User } = require("../schemas/User");
const authMiddleware = require("../middlewares/auth-middleware");
const { Cart } = require("../schemas/Cart");

//전체메뉴에서 음료 api
menuRouter.get("/drink", async (req, res) => {
  try {
    let result = await Category.find({});
    return res.send({ result });
  } catch (err) {
    console.log(err);
    res.status(500).send({ err: err.message });
  }
});

//카테고리별 페이지 api
menuRouter.get("/drink/categories/:categoryId", async (req, res) => {
  try {
    let { categoryId } = req.params;
    let category = await Category.findOne({ _id: categoryId });
    let category_name = category.eng_name;
    let result = await Menu.find({ eng_category: category_name });
    return res.send({ result });
  } catch (err) {
    console.log(err);
    res.status(500).send({ err: err.message });
  }
});

//음료별 페이지 api
menuRouter.get("/drink/:menuId", async (req, res) => {
  try {
    let { menuId } = req.params;
    let result = await Menu.findOne({ _id: menuId });
    return res.send({ result });
  } catch (err) {
    console.log(err);
    res.status(500).send({ err: err.message });
  }
});

//지금 카테고리를 따로 나눠야 할 것 같아서 post 요청 보낼려고 임시로 만든 Router
menuRouter.post("/", async (req, res) => {
  const category = new Category({ ...req.body });
  await category.save();
  res.send("성공");
});

//새로나온 메뉴
menuRouter.get("/new_menu", async (req, res) => {
  try {
    let result = await Menu.find({ category: "2021 CherryBlossom" });
    return res.send({ result });
  } catch (err) {
    console.log(err);
    res.status(500).send({ err: err.message });
  }
});

// 인기메뉴
menuRouter.get("/popular_menu", async (req, res) => {
  try {
    let recent_history = await UserHistory.find({})
      .populate([{ path: "menu" }])
      .sort("-date")
      .limit(5);

    console.log(recent_history);
    let popular_menu = [];
    recent_history.forEach(function (e) {
      popular_menu.push(e.menu);
    });
    res.send({ result: popular_menu });
  } catch (error) {
    res.status(400).send({ err: err.message });
  }
});

//나만의 메뉴
menuRouter.post("/mymenu", authMiddleware, async (req, res) => {
  const userId = res.locals.user;
  const { menuId, size, cup_option,price } = req.body;
  // console.log(userId, menuId, size, cup_option);
  try {
    const [user, menu] = await Promise.all([
      User.findOne({ id: userId }),
      Menu.findById(menuId),
    ]);

    // console.log(user['_id'], menu['_id']);
    // console.log(userId, menu, size, cup_option);
    Mymenu.create({ user, menu, size, cup_option });
    return res.send({ result: "나만의 메뉴 저장에 성공했습니다!" });
  } catch (err) {
    return res.status(400).send({ err: "나만의 메뉴 저장에 실패했습니다." });
  }
});

//나만의 메뉴
// 아직 공사중
menuRouter.get("/mymenu", authMiddleware, async (req, res) => {
  const userId = res.locals.user;
  // console.log(userId,typeof(userId));
  try {

    user = await User.findOne({id:userId});
    userid = user['_id']
    mymy = await Mymenu.find({user:userid});
    mymenu = [];
    // 이거 컬럼하나씩 뽑아주는거 못하나..
    for(let i=0; i<mymy.length; i++){
      menuId = mymy[i]["menu"];
      menu = await Menu.findOne({_id:menuId});
      eng_name=menu["eng_name"];
      name=menu["name"];
      image=menu["image"];
      size = mymy[i]["size"];
      cup_option = mymy[i]["cup_option"];
      
      mymenu[i] = {eng_name,name,image,size,cup_option};
    }
    console.log(mymenu)

    return res.status(200).send({result:mymenu});
    // return res.send({ user, menu, size, cup_option });
  } catch (err) {
    return res
      .status(400)
      .send({ err: "나만의 메뉴 불러오기에 실패했습니다." });
  }
});

//카트 넣기
menuRouter.post("/:menuId/cart", authMiddleware, async (req, res) => {
  const userId = res.locals.user;
  const { menuId } = req.params;
  try {
    const menu = await Menu.findOne({ _id: menuId });
    const isCart = await Cart.findOne().and([{ userId }, { menu }]);
    if (!isCart) {
      const newCart = new Cart({ userId, menu, ...req.body });
      await newCart.save();
      return res.send({ result: "success" });
    }
    await Cart.findOneAndUpdate(
      { userId, menu },
      { $set: { num: req.body.num } }
    );
    return res.send({ result: "success" });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ err: err.message });
  }
});

//카트 목록 불러오기
menuRouter.get("/cart", authMiddleware, async (req, res) => {
  const userId = res.locals.user;
  try {
    const carts = await Cart.find({ userId }).populate({ path: "menu" });
    return res.send({ result: carts });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ err: err.message });
  }
});
module.exports = {
  menuRouter,
};
