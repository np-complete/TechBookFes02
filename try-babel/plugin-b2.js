export default ({types: t}) => ({
  visitor: {
    Program: (path) => {
      console.log('b2');
    }
  }
});
