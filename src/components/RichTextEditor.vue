<template>
  <div>
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="editor-button-container">
        <button
          v-for="editorOption in editorOptions"
          :key="editorOption.name"
          :class="{
            'editor-button': true,
            'is-active': isActive[editorOption.name](),
          }"
          @click.prevent="toggleEditorOption(editorOption.name)"
        >
          <font-awesome-icon
            class="fas"
            :icon="['fas', editorOption.icon]"
          />
        </button>
      </div>
    </editor-menu-bar>
    <editor-content :editor="editor" class="newtopicinput"/>
  </div>
</template>

<script>
  import {Editor, EditorContent, EditorMenuBar} from 'tiptap'
  import {
    Blockquote,
    CodeBlock,
    HardBreak,
    Heading,
    OrderedList,
    BulletList,
    ListItem,
    TodoItem,
    TodoList,
    Bold,
    Code,
    Italic,
    Link,
    Strike,
    Underline,
    History,
    HorizontalRule,
  } from 'tiptap-extensions'
  import {findPositionOfNodeBefore} from "prosemirror-utils";

  export default {
    name: "RichTextEditor",
    components: {
      EditorContent,
      EditorMenuBar
    },
    props: ['value'],
    watch: {
      value(val) {
        if (val !== this.editor.getHTML()) {
          this.editor.setContent(val)
        }
      }
    },
    mounted() {
      this.editor.setContent(this.value)
    },
    data() {
      return {
        editor: new Editor({
          extensions: [
            new Blockquote(),
            new CodeBlock(),
            new HardBreak(),
            new Heading({levels: [1, 2, 3]}),
            new BulletList(),
            new OrderedList(),
            new ListItem(),
            new TodoItem(),
            new TodoList(),
            new Bold(),
            new Code(),
            new Italic(),
            new Link(),
            new Strike(),
            new Underline(),
            new History(),
            new HorizontalRule(),
          ],
          onUpdate: ({getHTML}) => {
            this.$emit('input', getHTML())
          },
          content: ``,
        }),
        editorOptions: [
          {name: 'bold', icon: 'bold'},
          {name: 'italic', icon: 'italic'},
          {name: 'underline', icon: 'underline'},
          {name: 'strike', icon: 'strikethrough'},
          {name: 'link', icon: 'link'},
          {name: 'heading', icon: 'heading'},
          {name: 'horizontal_rule', icon: 'minus'},
        ],
      }
    },
    computed: {
      editor_content() {
        return this.editor.getHTML()
      }
    },
    beforeDestroy() {
      this.editor.destroy()
    },
    methods: {
      toggleEditorOption(name) {
        switch (name) {
          // override the heading
          case 'heading':
            this.editor.commands.heading({level: 1});
            break;
          case 'link':
            const { empty } = this.editor.state.tr.selection
            if (empty) {
              // show popup to enter text and link
              const text = prompt('Enter text to link:')
              if (text) {
                const link = this.showLinkMenu()
                const doc = this.editor.getJSON()
                const lastParagraph = doc.content[doc.content.length -1]
                if (!lastParagraph.content) {
                  Object.assign(lastParagraph, { content: [] })
                }
                lastParagraph.content.push({
                  type: 'text',
                  text,
                  marks: [{
                    type: 'link',
                    attrs: {
                      href: link,
                    }
                  }]
                })
                this.editor.setContent(doc)
              }
            } else {
              this.showLinkMenu()
            }
            break;
          default:
            this.editor.commands[name]();
            break;
        }
      },
      showLinkMenu() {
        let link = prompt('Enter the URL:');
        if (link) {
          if (!/^(f|ht)tps?:\/\//i.test(link)) {
            link = "https://" + link;
          }

          this.setLinkUrl(link);
          return link;
        }
      },
      setLinkUrl(url) {
        this.editor.commands.link({href: url});
        this.editor.focus()
      },
    }
  }
</script>

<style>
  .newtopicinput {
    border-radius: 2px;
    box-shadow: none;
    border: none;
    background-color: #f1f1f1;
    font-size: 14px;
    color: black;
    font-family: 'Open Sans Light', sans-serif;
    margin-bottom: 20px;
  }

  .newtopicinput > div {
    padding: 10px;
  }

  .newtopicinput a {
    cursor: pointer;
    color: #007bff;
  }

  .editor-button-container {
    margin: 0 0 1em 0;
  }

  .editor-button {
    background: none;
    border: 1px solid #d8d8d8;
    margin-right: 0.5em;
    width: 40px;
    border-radius: 4px;
  }

  .is-active {
    border: 1px solid #000;
  }
</style>
