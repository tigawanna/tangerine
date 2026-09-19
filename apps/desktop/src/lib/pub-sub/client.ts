import { EventEmitter, on } from "node:events";
import { type PubSubTopic } from "./topics";

type PubSubCallback = (message: unknown) => void;

/** Default Node limit is 10; SSE can open many concurrent listeners. */
const MAX_LISTENERS = 100;

const GLOBAL_KEY = "__tangerinePubSub__" as const;

type GlobalWithPubSub = typeof globalThis & {
  [GLOBAL_KEY]?: PubSub;
};

/** In-process pub/sub over a shared EventEmitter. */
export class PubSub {
  readonly #emitter = new EventEmitter().setMaxListeners(MAX_LISTENERS);

  publish(topic: PubSubTopic, message: unknown): void {
    this.#emitter.emit(topic, message);
  }

  subscribe(topic: PubSubTopic, callback: PubSubCallback): void {
    this.#emitter.on(topic, callback);
  }

  unsubscribe(topic: PubSubTopic, callback: PubSubCallback): void {
    this.#emitter.off(topic, callback);
  }

  /**
   * Async-iterable subscription for SSE (AbortSignal cleans up on disconnect).
   * Yields each published message for `topic`.
   */
  async *listen<T = unknown>(
    topic: PubSubTopic,
    options?: { signal?: AbortSignal },
  ): AsyncGenerator<T, void, undefined> {
    for await (const [message] of on(this.#emitter, topic, options)) {
      yield message as T;
    }
  }
}

/**
 * Process-wide singleton (survives Vite/HMR module re-evaluation).
 * Import this from Elysia routes/workers — do not `new PubSub()` per file.
 */
export const pubSub: PubSub = (() => {
  const g = globalThis as GlobalWithPubSub;
  g[GLOBAL_KEY] ??= new PubSub();
  return g[GLOBAL_KEY];
})();
