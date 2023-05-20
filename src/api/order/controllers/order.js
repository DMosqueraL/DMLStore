"use strict";
const stripe = require("stripe")(
  "sk_test_51N9us3C5JPlgWmx4F3VcqQg1hvIqYfavt0ejq1DeAnXtGdCWk3fode6u0wGCNIKEKyZiFOGkFslMynYvzjHVIKyo00AJUEk7Pl"
);

function calcDiscountPrice(price, discount) {
  if (!discount) return price;

  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;

  return result.toFixed(2);
}

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, idUser, addressShipping } = ctx.request.body;

    let totalPayment = 0;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );
      totalPayment += Number(priceTemp) * product.quantity;
    });
    const charge = await stripe.charges.create({
      amount: totalPayment * 100,
      currency: "USD",
      source: token.id,
      description: `User ID: ${idUser}`,
    });
    const data = {
      products,
      user: idUser,
      totalPayment,
      idPayment: charge.id,
      addressShipping,
    };
    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreation(
      model,
      data
    );
    const entry = await strapi.db
      .query("api::order.order")
      .create({ data: validData });

    return entry;
  },
}));
