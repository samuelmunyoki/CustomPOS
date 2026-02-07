declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): any[];
    export(): Uint8Array;
  }
  
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
  
  function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
  
  export default initSqlJs;
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface AutoTableOptions {
    startY?: number;
    head?: any[][];
    body?: any[][];
    [key: string]: any;
  }
  
  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: AutoTableOptions) => void;
  }
  
  export = jsPDFWithAutoTable;
}
