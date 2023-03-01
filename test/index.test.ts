import { expect, describe, test } from "vitest";
import {
  toBase64,
  trimBase64,
  modifiersGenerator,
  generateSignature,
  generateHmac,
  getImageUrl,
} from "../src";

const imgproxySecret = "6F787973686F70";
const imgproxySalt = "10D16F7A61";
const imageUrl =
  "http://object-storage:9000/oxyshop-nextgen/media/image/e9/77/151f15b8f9af244f7f61775ddb3d.png";

describe("@misaon/imgproxy", () => {
  test("toBase64", () => {
    expect(toBase64(imageUrl)).toBe(
      "aHR0cDovL29iamVjdC1zdG9yYWdlOjkwMDAvb3h5c2hvcC1uZXh0Z2VuL21lZGlhL2ltYWdlL2U5Lzc3LzE1MWYxNWI4ZjlhZjI0NGY3ZjYxNzc1ZGRiM2QucG5n"
    );
  });

  test("trimBase64", () => {
    expect(trimBase64(imageUrl)).toBe(
      "http:__object-storage:9000_oxyshop-nextgen_media_image_e9_77_151f15b8f9af244f7f61775ddb3d.png"
    );
  });

  test("modifiersGenerator", () => {
    expect(modifiersGenerator({ width: "768", height: "0" })).toBe("h:0/w:768");
  });

  test("generateSignature", () => {
    expect(
      generateSignature(
        generateHmac(imgproxySecret, imgproxySalt),
        "/h:0/w:768/aHR0cDovL29iamVjdC1zdG9yYWdlOjkwMDAvb3h5c2hvcC1uZXh0Z2VuL21lZGlhL2ltYWdlL2U5Lzc3LzE1MWYxNWI4ZjlhZjI0NGY3ZjYxNzc1ZGRiM2QucG5n"
      )
    ).toBe("Cx5iQmOHCbKutYvXOMuWX-wdEbifMFwgrMXtNJEPgow");
  });

  test("getImageUrl", () => {
    expect(
      getImageUrl(imageUrl, {
        secret: imgproxySecret,
        salt: imgproxySalt,
        baseURL: "/imgproxy",
        modifiers: {
          width: "768",
          height: "0",
        },
      })
    ).toBe(
      "/imgproxy/Cx5iQmOHCbKutYvXOMuWX-wdEbifMFwgrMXtNJEPgow/h:0/w:768/aHR0cDovL29iamVjdC1zdG9yYWdlOjkwMDAvb3h5c2hvcC1uZXh0Z2VuL21lZGlhL2ltYWdlL2U5Lzc3LzE1MWYxNWI4ZjlhZjI0NGY3ZjYxNzc1ZGRiM2QucG5n"
    );
  });
});
