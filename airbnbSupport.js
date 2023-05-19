import data from "./data/airbnb.json" assert { type: "json" };

data.map((elem) => {
  if (elem.reviews) {
    console.log(new Date(elem.reviews[0].date));
  }
});
