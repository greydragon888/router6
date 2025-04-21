import { PluginFactory } from "router5";

const loggerPlugin: PluginFactory = () => {
  let startGroup, endGroup;

  startGroup = (label: string) => {
    console.groupCollapsed(label);
  };
  endGroup = () => {
    console.groupEnd();
  };
  startGroup = (label: string) => {
    console.group(label);
  };
  endGroup = () => {
    console.groupEnd();
  };

  console.info("Router started");

  return {
    onStop() {
      console.info("Router stopped");
    },
    onTransitionStart(toState, fromState) {
      endGroup();
      startGroup("Router transition");
      console.log("Transition started from state");
      console.log(fromState);
      console.log("To state");
      console.log(toState);
    },
    onTransitionCancel() {
      console.warn("Transition cancelled");
    },
    onTransitionError(_toState, _fromState, err: { code: string }) {
      console.warn(`Transition error with code ${err.code}`);
      endGroup();
    },
    onTransitionSuccess() {
      console.log("Transition success");
      endGroup();
    },
  };
};

export default loggerPlugin;
