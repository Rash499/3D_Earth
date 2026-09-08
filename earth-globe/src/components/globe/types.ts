import type { Feature, Geometry } from "geojson";

export type CountryProperties = {
  name?: string;
  [key: string]: unknown;
};

export type CountryFeature = Feature<
  Geometry,
  CountryProperties
> & {
  id?: string | number;
};

export type CountryInfo = {
  name: string;
  officialName?: string;
  capital?: string;
  population?: number;
  area?: number;
  region?: string;
  subregion?: string;
  flag?: string;
  currencies?: string[];
  languages?: string[];
  continents?: string[];
};

export type TopoJSON = {
  objects?: {
    countries?: unknown;
  };
};