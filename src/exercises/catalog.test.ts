import { describe, expect, it } from "vitest";
import { exerciseCatalog, getExerciseConfig } from "./catalog";

describe("exercise catalog", () => {
  it("keeps the approved three-exercise scope in one configuration boundary", () => {
    expect(exerciseCatalog.map((exercise) => exercise.type)).toEqual([
      "squat",
      "pushup",
      "curl",
    ]);
  });

  it("returns a typed configuration for a selected exercise", () => {
    expect(getExerciseConfig("curl")).toMatchObject({
      name: "哑铃弯举",
      recommendedView: "侧面或斜前方，上半身入镜",
    });
  });
});
