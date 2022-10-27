import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import foodizAbi from "../contract/foodiz.abi.json";

const ERC20_DECIMALS = 18;
const FoodizContractAddress = "0x267174CA118F870832Be54C29343b7bdABAD54B8";

let total = new BigNumber(0);
let meals = [];
let orders = [];
let contract;
let kit;

class Order {
  constructor(mealId, count) {
    this.mealId = mealId;
    this.count = count;
  }
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

const getUser = async function () {
  let username = prompt("Enter Your Name", "Guest");
  setTimeout(() => {
    let time = new Date();
    if (time.getHours() < 12 && time.getHours() >= 0) {
      notification(
        "Good Morning " +
          username +
          ", Hope You are doing well. Welcome to our site, We provide best quality food at such an affordable price that you will not regret after ordering from our site."
      );
    } else if (time.getHours() >= 12 && time.getHours() <= 16) {
      notification(
        "Good Afternoon " +
          username +
          ", Hope You are doing well. Welcome to our site, We provide best quality food at such an affordable price that you will not regret after ordering from our site."
      );
    } else if (time.getHours() >= 16 && time.getHours() <= 22) {
      notification(
        "Good Evening " +
          username +
          ", Hope You are doing well. Welcome to our site, We provide best quality food at such an affordable price that you will not regret after ordering from our site."
      );
    } else if (time.getHours() >= 22 && time.getHours() < 24) {
      notification(
        "Hello " +
          username +
          ", Hope You are doing well. Welcome to our site, We provide best quality food at such an affordable price that you will not regret after ordering from our site."
      );
    }
  }, 3000);
};

const getBalance = async function () {
  notification("⌛ Getting Balance...");
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const CELOBalance = totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = CELOBalance;
};

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(foodizAbi, FoodizContractAddress);
      await getBalance();
      await getUser();
      await getMeals();
      setTimeout(() => {
        notificationOff();
      }, 10000);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

const getMeals = async function () {
  if (contract) {
    notification("⌛ Getting Meals...");
    const _mealLength = await contract.methods.getMealslength().call();
    const _meals = [];
    for (let i = 0; i < _mealLength; i++) {
      let _meal = new Promise(async (resolve, reject) => {
        let p = await contract.methods.getMeal(i).call();
        resolve({
          index: i,
          name: p[0],
          image: p[1],
          price: new BigNumber(p[2]),
          sold: p[3],
        });
      });
      _meals.push(_meal);
    }
    meals = await Promise.all(_meals);
    showMenu();
    notificationOff();
  }
};

function showMenu() {
  document.getElementById("menu").innerHTML = "";
  meals.forEach((_meal) => {
    const newDiv = document.createElement("div");
    newDiv.className = "maincard";
    newDiv.innerHTML = foodTemplate(_meal);
    document.getElementById("menu").appendChild(newDiv);
  });
}

function foodTemplate(_meal) {
  return `
    <div>
      <div class="maincard-img">
        <img src="${_meal.image}" alt="" />
        <div style="position: fixed"> 
          <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start sold">
          ${_meal.sold} Sold
          </div>
        </div>
      </div>
      <div class="maincardtext">${_meal.name}</div>
      <div class="maprice">${_meal.price
        .shiftedBy(-ERC20_DECIMALS)
        .toFixed(2)} CELO per piece</div>
      <button
        class="mbutton addToCart"
        style="text-align: center !important;"
        id="mbtn${_meal.index}"
      >
        Add to Cart
      </button>
      <div
        id="item${_meal.index}"
        class="Reitem"
        style="
          display: none;
          flex-wrap: wrap;
          justify-content: space-evenly;
          width: 100%;
          font-size: 35px;
        "
      >
        <div
          id="p${_meal.index}"
          class="p add"
        >
          <span id="p${_meal.index}" class="p add">+</span>
        </div>
        <div class="display" id="counter${_meal.index}">0</div>
        <div
          id="m${_meal.index}"
          class="m sub"
        >
          <span id="m${_meal.index}" class="m sub">-</span>
        </div>
      </div>
    </div>
  `;
}

function addToCart(mealId, price) {
  let a = document.getElementById("amtbtn");
  let b = document.getElementById(`counter${mealId}`);
  let c = document.getElementById(`item${mealId}`);
  let d = document.getElementById(`mbtn${mealId}`);
  d.style.display = "none";
  c.style.display = "flex";
  b.innerHTML = parseInt(b.innerHTML) + 1;
  total = total.plus(price);
  a.innerHTML = total.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  const order = new Order(Number(mealId), 1);
  orders.push(order);
}

function updateCount(mealId, ele, price) {
  let b = document.getElementById(`counter${mealId}`);
  let c = document.getElementById(`item${mealId}`);
  let d = document.getElementById(`mbtn${mealId}`);
  if (parseInt(b.innerHTML) > 0) {
    b.innerHTML = parseInt(b.innerHTML) + ele;
    let a = document.getElementById("amtbtn");
    total = total.plus(price);
    a.innerHTML = total.shiftedBy(-ERC20_DECIMALS).toFixed(2);

    const update = orders.map((meal) =>
      meal.mealId === Number(mealId)
        ? { ...meal, count: meal.count + ele }
        : meal
    );
    orders = update;
  }
  if (parseInt(b.innerHTML) == 0) {
    let array = orders.filter((meal) => meal.mealId !== Number(mealId));
    orders = array;
    c.style.display = "none";
    d.style.display = "inline";
  }
}

async function pay() {
  if (total < 0) return;
  let reference = Math.random() * 10000000;
  let d = parseInt(reference);

  console.log(orders);

  try {
    await contract.methods
      .placeOrder(orders)
      .send({ from: kit.defaultAccount, value: total });
    await getBalance();
    await getMeals();
    notification(
      `🎉 Payment made placed successfully, Your order will be delivered shortly with reference number: QO${d}`
    );
    orders = [];
    return true;
  } catch (error) {
    notification(`⚠️ ${error}.`);
    return false;
  }
}

document.querySelector("#newMealBtn").addEventListener("click", async (e) => {
  const params = [
    document.getElementById("newMealName").value,
    document.getElementById("newImgUrl").value,
    new BigNumber(document.getElementById("newPrice").value)
      .shiftedBy(ERC20_DECIMALS)
      .toString(),
  ];
  if (params[2] < 0) return;

  notification(`⌛ Adding "${params[0]}"...`);
  try {
    const result = await contract.methods
      .addNewMeal(...params)
      .send({ from: kit.defaultAccount });
  } catch (error) {
    notification(`⚠️ ${error}.`);
  }
  notification(`🎉 You successfully added "${params[0]}".`);
  getMeals();
});

document.querySelector("#explore").addEventListener("click", async (e) => {
  let show = document.getElementById("intca");
  if (show.style.display != "none") {
    show.style.display = "none";
  } else {
    show.style.display = "flex";
  }
});

document.querySelector("#payBtn").addEventListener("click", async (e) => {
  notification(`⌛ Placing your orders...`);
  let successful = await pay();

  if (!successful) {
    notification(`⚠️ Payment not successful, Please try again.`);
  } else {
    total = new BigNumber(0);
    let a = document.getElementsByClassName("Reitem");
    let b = document.getElementsByClassName("mbutton");
    let c = document.getElementsByClassName("display");
    let e = document.getElementById("amtbtn");
    e.innerHTML = total;
    for (let i = 0; i < a.length; i++) {
      a[i].style.display = "none";
    }
    for (let j = 0; j < b.length; j++) {
      b[j].style.display = "inline";
    }
    for (let j = 0; j < c.length; j++) {
      c[j].innerHTML = 0;
    }
  }
});

document.querySelector("#menu").addEventListener("click", async (e) => {
  if (e.target.className.includes("addToCart")) {
    const index = e.target.id;
    const id = index.match(/(\d+)/);
    addToCart(id[0], meals[id[0]].price);
  } else if (e.target.className.includes("add")) {
    const index = e.target.id;
    const id = index.match(/(\d+)/);
    updateCount(id[0], 1, meals[id[0]].price);
  } else if (e.target.className.includes("sub")) {
    const index = e.target.id;
    const id = index.match(/(\d+)/);
    updateCount(id[0], -1, -meals[id[0]].price);
  }
});

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
});
