import type { Feature, FeatureCollection, Geometry } from "geojson";

export type CountryProperties = { name?: string; [key: string]: unknown };

export type CountryFeature = Feature<Geometry, CountryProperties> & {
  id?: string | number;
};

export type CountryInfo = {
  name: string;
  capital?: string;
  population?: number;
  region?: string;
  flag?: string;
};

export type TopoJSON = {
  objects?: { countries?: unknown };
};
