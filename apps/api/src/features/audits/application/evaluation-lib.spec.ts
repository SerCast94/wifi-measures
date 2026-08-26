import {
  evalCount,
  evalHigher,
  evalLower,
  interpretConnectivityArray,
  normalizePercent,
  parseNum,
  reasonsHintFailure,
} from "./evaluation-lib";

describe("parseNum", () => {
  it("acepta números finitos", () => {
    expect(parseNum(-67.5)).toBe(-67.5);
    expect(parseNum(0)).toBe(0);
  });

  it("parsea cadenas numéricas", () => {
    expect(parseNum("-65")).toBe(-65);
    expect(parseNum(" 42 ")).toBe(42);
  });

  it("devuelve null en métricas no medidas del AirCheck", () => {
    expect(parseNum("--")).toBeNull();
    expect(parseNum("")).toBeNull();
    expect(parseNum("   ")).toBeNull();
    expect(parseNum(undefined)).toBeNull();
    expect(parseNum(null)).toBeNull();
    expect(parseNum("abc")).toBeNull();
  });
});

describe("evalHigher (mayor es mejor)", () => {
  const threshold = { passMin: -67, warnMin: -72 };

  it("PASS por encima del objetivo", () => {
    const result = evalHigher(-60, threshold, "dBm", "RSSI");
    expect(result.status).toBe("PASS");
    expect(result.unit).toBe("dBm");
    expect(result.threshold?.operator).toBe(">=");
    expect(result.message).toContain("-60");
  });

  it("WARNING dentro del margen", () => {
    expect(evalHigher(-70, threshold, "dBm", "RSSI").status).toBe("WARNING");
  });

  it("FAIL por debajo del mínimo", () => {
    expect(evalHigher(-80, threshold, "dBm", "RSSI").status).toBe("FAIL");
  });

  it("UNKNOWN sin dato o sin umbral", () => {
    expect(evalHigher(null, threshold, "dBm", "RSSI").status).toBe("UNKNOWN");
    expect(evalHigher(-60, { warnMin: -72 }, "dBm", "RSSI").status).toBe(
      "UNKNOWN"
    );
  });

  it("WARNING cuando solo existe warnMin y se supera", () => {
    // passMin undefined → UNKNOWN aunque el valor sea bueno
    const result = evalHigher(-50, { warnMin: -72 }, "dBm", "RSSI");
    expect(result.status).toBe("UNKNOWN");
  });
});

describe("evalLower (menor es mejor)", () => {
  const threshold = { passMax: 50, warnMax: 70 };

  it("PASS por debajo del objetivo", () => {
    const result = evalLower(35, threshold, "%", "Utilización");
    expect(result.status).toBe("PASS");
    expect(result.unit).toBe("%");
  });

  it("WARNING entre objetivo y advertencia", () => {
    expect(evalLower(60, threshold, "%", "Utilización").status).toBe("WARNING");
  });

  it("FAIL por encima del máximo tolerable", () => {
    expect(evalLower(85, threshold, "%", "Utilización").status).toBe("FAIL");
  });

  it("UNKNOWN sin dato", () => {
    expect(evalLower(null, threshold, "%", "Utilización").status).toBe(
      "UNKNOWN"
    );
  });
});

describe("evalCount (recuentos)", () => {
  it("evalúa APs rogue con umbral cero estricto", () => {
    expect(evalCount(0, { passMax: 0, warnMax: 2 }, "Rogue").status).toBe(
      "PASS"
    );
    expect(evalCount(1, { passMax: 0, warnMax: 2 }, "Rogue").status).toBe(
      "WARNING"
    );
    expect(evalCount(5, { passMax: 0, warnMax: 2 }, "Rogue").status).toBe(
      "FAIL"
    );
  });

  it("la unidad de recuento es null", () => {
    expect(evalCount(1, { passMax: 2 }, "Rogue").unit).toBeNull();
  });
});

describe("interpretConnectivityArray", () => {
  it("array vacío: prueba no realizada", () => {
    const result = interpretConnectivityArray([]);
    expect(result.ran).toBe(false);
    expect(result.status).toBe("UNKNOWN");
    expect(result.detail).toContain("no realizada");
  });

  it("no-array: prueba no realizada", () => {
    expect(interpretConnectivityArray(undefined).ran).toBe(false);
    expect(interpretConnectivityArray("n/a").ran).toBe(false);
  });

  it("resultados positivos conocidos", () => {
    expect(interpretConnectivityArray([{ color: "green" }]).status).toBe("PASS");
    expect(
      interpretConnectivityArray([{ status: "success" }, { ok: true }]).status
    ).toBe("PASS");
  });

  it("resultados negativos conocidos", () => {
    expect(interpretConnectivityArray([{ color: "red" }]).status).toBe("FAIL");
    expect(
      interpretConnectivityArray([{ result: "timeout" }]).status
    ).toBe("FAIL");
  });

  it("datos no interpretables: UNKNOWN honesto, nunca inventado", () => {
    const result = interpretConnectivityArray([{ foo: 1 }]);
    expect(result.ran).toBe(true);
    expect(result.status).toBe("UNKNOWN");
  });

  it("mezcla de aciertos y fallos: UNKNOWN", () => {
    expect(
      interpretConnectivityArray([{ color: "green" }, { color: "red" }]).status
    ).toBe("UNKNOWN");
  });
});

describe("reasonsHintFailure", () => {
  const reasons = ["DHCP server timeout", "Link auth failed"];

  it("detecta palabras clave y devuelve el motivo original", () => {
    expect(reasonsHintFailure(reasons, ["dhcp"])).toBe("DHCP server timeout");
    expect(reasonsHintFailure(reasons, ["auth"])).toBe("Link auth failed");
  });

  it("null si no coincide nada o la entrada no es válida", () => {
    expect(reasonsHintFailure(reasons, ["dns"])).toBeNull();
    expect(reasonsHintFailure("--", ["dhcp"])).toBeNull();
    expect(reasonsHintFailure(undefined, ["dhcp"])).toBeNull();
  });
});

describe("normalizePercent", () => {
  it("null con series vacías", () => {
    expect(normalizePercent([])).toBeNull();
  });

  it("valores ya en porcentaje se respetan", () => {
    expect(normalizePercent([10, 45.55])).toBe(45.6);
  });

  it("valores en fracción 0-1 se convierten a porcentaje", () => {
    expect(normalizePercent([0.42])).toBe(42);
    expect(normalizePercent([0.426])).toBe(42.6);
  });

  it("usa el peor caso (máximo) de la serie", () => {
    expect(normalizePercent([0.1, 0.8, 0.3])).toBe(80);
  });
});
