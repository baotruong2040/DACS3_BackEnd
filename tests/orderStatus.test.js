const { ORDER_STATUS, isValidStatusTransition } = require("../src/constants/orderStatus");

describe("order status transitions", () => {
  test("accepts valid linear transitions", () => {
    expect(
      isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING)
    ).toBe(true);
    expect(
      isValidStatusTransition(ORDER_STATUS.PREPARING, ORDER_STATUS.READY)
    ).toBe(true);
    expect(
      isValidStatusTransition(ORDER_STATUS.READY, ORDER_STATUS.DELIVERING)
    ).toBe(true);
    expect(
      isValidStatusTransition(ORDER_STATUS.DELIVERING, ORDER_STATUS.DELIVERED)
    ).toBe(true);
  });

  test("accepts pending to cancelled", () => {
    expect(
      isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED)
    ).toBe(true);
  });

  test("rejects invalid transitions", () => {
    expect(
      isValidStatusTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.PENDING)
    ).toBe(false);
    expect(
      isValidStatusTransition(ORDER_STATUS.PENDING, ORDER_STATUS.DELIVERED)
    ).toBe(false);
    expect(
      isValidStatusTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.PREPARING)
    ).toBe(false);
  });
});
