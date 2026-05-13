declare module '@lob/lob-typescript-sdk' {
  export class LetterEditable {
    constructor(data: Record<string, any>);
  }
  export enum LetterEditableExtraServiceEnum {
    CertifiedReturnReceipt = 'certified_return_receipt',
  }
  export class LettersApi {
    constructor(config: any);
    create(data: LetterEditable): Promise<any>;
  }
  export class Configuration {
    constructor(config: { username: string });
  }
}
