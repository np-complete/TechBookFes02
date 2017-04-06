export default ({types: t}) => ({
  visitor: {
    BinaryExpression: (path) => {
      const { left, right, operator} = path.node;
      const matched = operator.match(/([!|=])==?/);
      if (matched) {
        if ((t.isNullLiteral(left) || t.isNullLiteral(right))) {
          path.node.operator = `${matched[1]}=`;
        } else {
          path.node.operator = `${matched[1]}==`;
        }
      }
    }
  }
});
