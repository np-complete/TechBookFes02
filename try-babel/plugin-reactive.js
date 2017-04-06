export default ({types: t}) => ({
  visitor: {
    IfStatement: (path) => {
      console.log('If Statement');
    },
    ReturnStatement: (path) => {
      console.log('Return Statement');
      path.parentPath.parentPath.replaceWith(
        t.ifStatement(
          t.booleanLiteral(false),
          t.blockStatement([])
        )
      );
    }
  }
});
