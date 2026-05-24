import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

function readValue(searchParams, config) {
  const raw = searchParams.get(config.key);
  if (raw == null || raw === "") return config.defaultValue;
  if (typeof config.parse === "function") return config.parse(raw);
  return raw;
}

function writeValue(params, value, config) {
  const serialized = typeof config.serialize === "function" ? config.serialize(value) : String(value ?? "");
  const isDefault = value === config.defaultValue;
  if (serialized.length === 0 || (config.omitIfDefault !== false && isDefault)) {
    params.delete(config.key);
    return;
  }
  params.set(config.key, serialized);
}

export function useUrlState(schema) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const next = {};
    for (const [field, config] of Object.entries(schema)) {
      next[field] = readValue(searchParams, config);
    }
    return next;
  }, [schema, searchParams]);

  const updateState = (updater) => {
    const current = {};
    for (const [field, config] of Object.entries(schema)) {
      current[field] = readValue(searchParams, config);
    }

    const next = typeof updater === "function" ? updater(current) : updater;
    const params = new URLSearchParams(searchParams);

    for (const [field, config] of Object.entries(schema)) {
      writeValue(params, next[field], config);
    }

    setSearchParams(params, { replace: true });
  };

  return [state, updateState, searchParams];
}
