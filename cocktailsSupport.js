import data from "./data/1001cocktails.json" assert { type: "json" };
import ingredients from "./data/1001cocktails/ingredients.json" assert { type: "json" };
import utensils from "./data/1001cocktails/utensils.json" assert { type: "json" };
import { customAlphabet } from "nanoid";
import fs from "fs";

const generateNumericId = customAlphabet("0123456789", 5); // Specify the character set and length

const saveToFile = (data) => {
  fs.writeFile(
    "./data/1001cocktails/cocktails.json",
    JSON.stringify(data),
    "utf8",
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("scraping success");
      }
    }
  );
};

let allCocktails = [];

data.map((cocktails) => {
  let ut = [];
  let it = [];
  let pt;

  cocktails.utensils.map((elem) => {
    const isHere = utensils.find((utensil) => {
      if (utensil.name === elem.name) {
        ut.push({
          id: utensil.id,
        });
      }
    });
  });

  cocktails.ingredients.map((elem) => {
    let qTab = [];
    if (typeof elem.quantity === "string") {
      const isSlash = elem.quantity.includes("/");
      const isDot = elem.quantity.includes(".");

      if (isSlash) {
        const quantityRegex = /^([\d/]+)/;
        const quantityValue = elem.quantity.match(quantityRegex)[0]; // "2"
        const remainingString = elem.quantity.replace(quantityRegex, "").trim(); // "cuilleres a soupe"
        const parts = quantityValue.split("/");
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        const result = numerator / denominator;
        qTab.push(result);
        if (remainingString) {
          qTab.push(remainingString);
        }
      } else if (isDot) {
        const quantityRegex = /^([\d.]+)/;
        const quantityValue = elem.quantity.match(quantityRegex)[0]; // "2"
        const remainingString = elem.quantity.replace(quantityRegex, "").trim(); // "cuilleres a soupe"

        qTab.push(Number(quantityValue));
        if (remainingString) {
          qTab.push(remainingString);
        }
      } else {
        const quantityRegex = /^(\d+)/;
        const quantityValue = elem.quantity.match(quantityRegex)[0]; // "2"
        const remainingString = elem.quantity.replace(quantityRegex, "").trim(); // "cuilleres a soupe"
        qTab.push(Number(quantityValue));
        if (remainingString) {
          qTab.push(remainingString);
        }
      }
    }

    const isHere = ingredients.find((ingredient) => {
      if (ingredient.name === elem.name) {
        it.push({
          id: ingredient.id,
          quantity: qTab[0] ? qTab[0] : elem.quantity,
          measure: qTab[1] && qTab[1],
        });
      }
    });
  });

  const preparationArray = Object.values(cocktails.preparation);

  console.log(preparationArray);

  cocktails.preparation = preparationArray;

  cocktails.utensils = ut;
  cocktails.ingredients = it;

  allCocktails.push(cocktails);
});

saveToFile(allCocktails);
