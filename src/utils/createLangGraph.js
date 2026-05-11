export function createLangGraph({ inputSchema }) {
  let nodes = {};
  let edges = {};
  let entryPoint = null;

  return {
    addNode(name, fn) {
      nodes[name] = fn;
      return this;
    },

    setEntryPoint(name) {
      if (!nodes[name]) throw new Error(`Node "${name}" not found`);
      entryPoint = name;
      return this;
    },

    addEdge(from, to) {
      if (!nodes[from]) throw new Error(`Node "${from}" not found`);
      if (to !== "END" && !nodes[to]) {
        throw new Error(`Node "${to}" not found`);
      }
      edges[from] = { type: 'direct', to: to };
      return this;
    },

    addConditionalEdges(from, conditionFn) {
      if (!nodes[from]) throw new Error(`Node "${from}" not found`);
      edges[from] = { type: 'conditional', condition: conditionFn };
      return this;
    },

    compile() {
      if (!entryPoint) throw new Error("Entry point not set");

      return async function (input) {
        // Validate input (if schema is provided)
        if (inputSchema) {
          // You can add Zod validation here later
        }

        let state = { ...input };
        let current = entryPoint;

        while (current && current !== 'END') {
          const node = nodes[current];
          if (!node) break;

          const result = await node(state);
          state = { ...state, ...result };

          const edge = edges[current];
          if (!edge) break;

          if (edge.type === 'direct') {
            current = edge.to;
          } else if (edge.type === 'conditional') {
            current = edge.condition(state);
          }
        }

        return state;
      };
    }
  };
}