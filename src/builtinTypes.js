const builtins = [
  {
    name: 'break',
    type: 'object',
    title: 'Break',
    fields: [
      {
        name: 'style',
        type: 'string',
        title: 'Break style',
        options: {
          list: [
            {title: 'Line break', value: 'lineBreak'},
            {title: 'Read more', value: 'readMore'}
          ]
        }
      }
    ]
  }
]

module.exports = builtins
