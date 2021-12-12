import {
  autorun,
  observe,
  IValueDidChange,
  IReactionPublic,
  IAutorunOptions,
  Lambda,
  IObservableValue,
  IComputedValue,
  IObservableArray,
  ObservableSet,
  ObservableMap,
  IObjectDidChange,
  ISetDidChange,
  IArraySplice,
  IMapDidChange
} from "mobx";

/**
 * A class to proxy mobx subscriptions so that we can group related subscriptions them together and
 * easily unsubscribe in an object-oriented way.
 */
export default class MobXProxy {
  private disposers: Lambda[] = [];

  disposeAndRemove(disposer: Lambda) {
    disposer();
    this.disposers = this.disposers.filter(d => d !== disposer);
  }

  // Pulled directly from MobX.
  observe<T>(
    value: IObservableValue<T> | IComputedValue<T>,
    listener: (change: IValueDidChange<T>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<T>(
    observableArray: IObservableArray<T>,
    listener: (change: IArraySplice<T>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<V>(
    observableMap: ObservableSet<V>,
    listener: (change: ISetDidChange<V>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<K, V>(
    observableMap: ObservableMap<K, V>,
    listener: (change: IMapDidChange<K, V>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<K, V>(
    observableMap: ObservableMap<K, V>,
    property: K,
    listener: (change: IValueDidChange<V>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe(
    object: Object,
    listener: (change: IObjectDidChange) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<T, K extends keyof T>(
    object: T,
    property: K,
    listener: (change: IValueDidChange<T[K]>) => void,
    fireImmediately?: boolean
  ): Lambda;
  observe<T, K extends keyof T>(
    target: T,
    propertyName: K,
    listener: (change: IValueDidChange<T[K]>) => void,
    invokeImmediately?: boolean
  ): Lambda;
  observe(thing: any, propOrCb?: any, cbOrFire?: any, fireImmediately?: any) {
    const disposer = observe(thing, propOrCb, cbOrFire, fireImmediately);
    this.disposers.push(disposer);
    return () => this.disposeAndRemove(disposer);
  }

  autorun(listener: (r: IReactionPublic) => any, options: IAutorunOptions) {
    const disposer = autorun(listener, options);
    this.disposers.push(disposer);
    return () => this.disposeAndRemove(disposer);
  }

  destroy() {
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
  }
}
