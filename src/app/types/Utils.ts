export interface KeyValueString {
  [key: string]: string
}

export type CustomError = {
    responseCode?: number | null,
    beschrijving: string | null
}