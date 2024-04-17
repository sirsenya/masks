import { process } from "../process";
import { Result } from "../types";

describe("should return false or correct result", () => {
  test(`1
  {
    store: [{ size: 2, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: true,
    mismatches: 1,
  }
  `, () => {
    expect(
      process(
        [{ size: 2, quantity: 1 }],
        [{ id: 102, size: [1, 2], masterSize: "s1" }]
      )
    ).toStrictEqual<Result>({
      stats: [{ size: 2, quantity: 1 }],
      assignment: [{ id: 102, size: 2 }],
      mismatches: 1,
    });
  });
  test(` 2
  {
    store: [{ size: 3, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: false,
    mismatches: 0,
  }
  `, () => {
    expect(
      process(
        [{ size: 3, quantity: 1 }],
        [{ id: 102, size: [1, 2], masterSize: "s1" }]
      )
    ).toBeFalsy();
  });
  test(` 3
  {
    store: [{ size: 2, quantity: 4 }],
    order: [
      { id: 101, size: [2] },
      { id: 102, size: [1, 2], masterSize: "s2" },
    ],
    isPossible: true,
    mismatches: 0,
  }
  `, () => {
    expect(
      process(
        [{ size: 2, quantity: 4 }],
        [
          { id: 101, size: [2] },
          { id: 102, size: [1, 2], masterSize: "s2" },
        ]
      )
    ).toStrictEqual<Result>({
      stats: [{ size: 2, quantity: 2 }],
      assignment: [
        { id: 101, size: 2 },
        { id: 102, size: 2 },
      ],
      mismatches: 0,
    });
  });
  test(` 4
    {
        store: [
          { size: 1, quantity: 1 },
          { size: 2, quantity: 2 },
          { size: 3, quantity: 1 },
        ],
        order: [
          { id: 100, size: [1] },
          { id: 101, size: [2] },
          { id: 102, size: [2, 3], masterSize: "s1" },
          { id: 103, size: [1, 2], masterSize: "s2" },
        ],
        isPossible: true,
        mismatches: 1,
      }
    `, () => {
    expect(
      process(
        [
          { size: 1, quantity: 1 },
          { size: 2, quantity: 2 },
          { size: 3, quantity: 1 },
        ],
        [
          { id: 100, size: [1] },
          { id: 101, size: [2] },
          { id: 102, size: [2, 3], masterSize: "s1" },
          { id: 103, size: [1, 2], masterSize: "s2" },
        ]
      )
    ).toStrictEqual<Result>({
      stats: [
        { size: 1, quantity: 1 },
        { size: 2, quantity: 2 },
        { size: 3, quantity: 1 },
      ],
      assignment: [
        { id: 100, size: 1 },
        { id: 101, size: 2 },
        { id: 102, size: 2 || 3 },
        { id: 103, size: 1 || 2 },
      ],
      mismatches: 1,
    });
  });
});
