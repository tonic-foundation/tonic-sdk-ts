const Table = require('cli-table');

const defaultProps = <T>(item: T) => {
  return Object.keys(item) as (keyof T)[];
};

export function pick<T>(
  item: T,
  keys: (keyof T)[],
  callFunctionProperty = false
) {
  return keys.map((k) => {
    const v = item[k];
    if (typeof v === 'function' && callFunctionProperty) {
      return v();
    }
    return v;
  });
}

interface TableOptions<T> {
  mappings?: Record<keyof T, string>;
  props?: (keyof T)[];
  callFunctionProperty?: boolean;
}
export function toTable<T>(items: T[], opts: TableOptions<T>): string;
export function toTable<T>(item: T, opts: TableOptions<T>): string;
export function toTable<T>(data: T | T[], opts: TableOptions<T>): string {
  if (!(data instanceof Array)) {
    const keys = opts.props || defaultProps(data);
    const table = new Table({
      head: keys as unknown as string[],
    });
    table.push(pick(data, keys, opts.callFunctionProperty));
    return table.toString();
  }
  const keys = opts.props || defaultProps(data[0]);
  const table = new Table({
    head: keys as unknown as string[],
  });
  data.forEach((d) => {
    table.push(pick(d, keys, opts.callFunctionProperty));
  });
  return table.toString();
}
