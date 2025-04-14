export const debounce = (func, delay) => {
  let inDebounce;

  const debouncedFunction = function () {
    const context = this;
    const args = arguments;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  };

  // Add a cancel method to clear the timeout
  debouncedFunction.cancel = () => {
    if (inDebounce) {
      clearTimeout(inDebounce);
    }
  };

  return debouncedFunction;
};
