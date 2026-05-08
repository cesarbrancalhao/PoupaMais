declare const jest: import('@jest/globals').jest;

declare namespace jest {
  type Mock<T extends (...args: any[]) => any = (...args: any[]) => any> =
    import('jest-mock').Mock<T>;
  type Mocked<T extends object> = import('jest-mock').Mocked<T>;
  type MockedClass<T extends new (...args: any) => any> =
    import('jest-mock').MockedClass<T>;
  type MockedFunction<T extends (...args: any) => any> =
    import('jest-mock').MockedFunction<T>;
  type MockedObject<T extends object> =
    import('jest-mock').MockedObject<T>;
  type Replaced<T> = import('jest-mock').Replaced<T>;
  type Spied<T extends new (...args: any) => any | ((...args: any) => any)> =
    import('jest-mock').Spied<T>;
  type SpiedClass<T extends new (...args: any) => any> =
    import('jest-mock').SpiedClass<T>;
  type SpiedFunction<T extends (...args: any) => any> =
    import('jest-mock').SpiedFunction<T>;
  type SpiedGetter<T> = import('jest-mock').SpiedGetter<T>;
  type SpiedSetter<T> = import('jest-mock').SpiedSetter<T>;
}

declare const describe: import('@jest/globals').describe;
declare const it: import('@jest/globals').it;
declare const test: import('@jest/globals').test;
declare const expect: import('@jest/globals').expect;
declare const beforeEach: import('@jest/globals').beforeEach;
declare const afterEach: import('@jest/globals').afterEach;
declare const beforeAll: import('@jest/globals').beforeAll;
declare const afterAll: import('@jest/globals').afterAll;