import puppeteer from "puppeteer";

let finalTab = [];

let cocktailsTab = [];

const getCocktails = async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(
    `https://www.1001cocktails.com/recettes/selection_cocktails-a-la-biere.aspx`,
    { waitUntil: "networkidle2" }
  );

  const max = await page.evaluate(() => {
    return Number(
      document.querySelector(".pagination .page-numbers:nth-last-child(2)")
        .innerText
    );
  });

  await browser.close();

  console.log(max);

  for (let i = 0; i < max; i++) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    console.log(i);

    if (i > 0) {
      await page.goto(
        `https://www.1001cocktails.com/recettes/selection_cocktails-a-la-biere.aspx/page/${
          i + 1
        }`,
        { waitUntil: "networkidle2" }
      );
    } else {
      await page.goto(
        `https://www.1001cocktails.com/recettes/selection_cocktails-a-la-biere.aspx`,
        { waitUntil: "networkidle2" }
      );
    }
    await page.waitForSelector(".cocktails__grid--2");

    if (cocktailsTab.length < 10) {
      const cocktails = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(".cocktails__grid--2 .recipe-card"),
        ].map((cocktail) => {
          const str = cocktail
            .querySelector("img")
            .getAttribute("src")
            .includes("blurred");

          if (!str) {
            const image =
              String(
                cocktail.querySelector("img").getAttribute("data-src")
              ).split("origin")[0] + "origin.jpg";

            const stars = [...cocktail.querySelectorAll(".filled-star")];

            const demiStar = cocktail.querySelector(".demi-star");

            return {
              name: cocktail.querySelector("h3").innerText,
              image,
              link: cocktail
                .querySelector(".recipe-card_content a")
                .getAttribute("href"),
              level: cocktail.querySelector(".level-recipe").innerText,
              cost: cocktail.querySelector(".price-recipe").innerText.length,
              stars: demiStar ? stars.length + 0.5 : stars.length,
              reviews: Number(
                cocktail
                  .querySelector(".number-reviews")
                  .innerText.split(" ")[0]
              ),
            };
          }
        });
      });

      cocktails.map((e) => {
        if (e !== null) {
          cocktailsTab.push(e);
        }
      });
    } else {
      await browser.close();
      break;
    }

    await browser.close();
  }

  for (let i = 0; i < cocktailsTab.length; i++) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(cocktailsTab[i].link, { waitUntil: "networkidle2" });

    const ingredients = await page.evaluate(() => {
      return [...document.querySelectorAll(".ingredient-card")].map((elem) => {
        return {
          name: elem.querySelector("h3").innerText,
          quantity:
            elem.querySelector(".ingredient-card__unit") &&
            elem.querySelector(".ingredient-card__unit").innerText,
          image: elem.querySelector("img").getAttribute("src"),
        };
      });
    });

    const utensils = await page.evaluate(() => {
      return [...document.querySelectorAll(".ustensile-card")].map((elem) => {
        return {
          name: elem.querySelector("h3").innerText,
          quantity: Number(
            elem.querySelector(".ustensile-card__unit").innerText
          ),
          image: elem.querySelector("img").getAttribute("src"),
        };
      });
    });

    const preparation = await page.evaluate(() => {
      const arrPreparation = [
        ...document.querySelectorAll(".cocktail-preparation__step"),
      ].map((elem) => {
        return elem.innerText;
      });

      const objPreparation = arrPreparation.reduce((acc, curr) => {
        const position = arrPreparation.indexOf(curr);
        acc["step" + (position + 1)] = curr;
        return acc;
      }, {});

      return objPreparation;
    });

    const video = await page.evaluate(() => {
      if (document.querySelector(".dailymotion_block iframe")) {
        return document
          .querySelector(".dailymotion_block iframe")
          .getAttribute("src");
      }
    });

    if (video) {
      cocktailsTab[i] = {
        ...cocktailsTab,
        ingredients,
        utensils,
        preparation,
        video,
      };
    } else {
      cocktailsTab[i] = {
        ...cocktailsTab[i],
        ingredients,
        utensils,
        preparation,
      };
    }

    await browser.close();
  }

  cocktailsTab.map((elem) => {
    console.log(elem.name);
  });
};

getCocktails();
