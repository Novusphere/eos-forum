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
    <div class="suggestion-list" v-show="showSuggestions" ref="suggestions">
      <template v-if="hasResults">
        <div
          v-for="(user, index) in filteredUsers"
          :key="user.id"
          class="suggestion-list__item"
          :class="{ 'is-selected': navigatedUserIndex === index }"
          @click="selectUser(user)"
        >
          {{ user.name }}
        </div>
      </template>
      <div v-else class="suggestion-list__item is-empty">
        No users found
      </div>
    </div>
  </div>
</template>

<script>
  import {storage} from "@/storage";
  import {Editor, EditorContent, EditorMenuBar} from 'tiptap'
  import Fuse from 'fuse.js'
  import tippy from 'tippy.js'
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
    Mention,
  } from 'tiptap-extensions'

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
      this.editor.setContent(this.value);
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
            new Mention({
              // a list of all suggested items
              items: () => storage.following.map((user) => ({
                id: user,
                name: user,
              })),
              // is called when a suggestion starts
              onEnter: ({
                          items, query, range, command, virtualNode,
                        }) => {
                this.query = query;
                this.filteredUsers = items;
                this.suggestionRange = range;
                this.renderPopup(virtualNode);
                // we save the command for inserting a selected mention
                // this allows us to call it inside of our custom popup
                // via keyboard navigation and on click
                this.insertMention = command
              },
              // is called when a suggestion has changed
              onChange: ({
                           items, query, range, virtualNode,
                         }) => {
                this.query = query;
                this.filteredUsers = items;
                this.suggestionRange = range;
                this.navigatedUserIndex = 0;
                this.renderPopup(virtualNode)
              },
              // is called when a suggestion is cancelled
              onExit: () => {
                // reset all saved values
                this.query = null;
                this.filteredUsers = [];
                this.suggestionRange = null;
                this.navigatedUserIndex = 0;
                this.destroyPopup()
              },
              // is called on every keyDown event while a suggestion is active
              onKeyDown: ({event}) => {
                // pressing up arrow
                if (event.keyCode === 38) {
                  this.upHandler();
                  return true
                }
                // pressing down arrow
                if (event.keyCode === 40) {
                  this.downHandler();
                  return true
                }
                // pressing enter
                if (event.keyCode === 13) {
                  this.enterHandler();
                  return true
                }
                return false
              },
              // is called when a suggestion has changed
              // this function is optional because there is basic filtering built-in
              // you can overwrite it if you prefer your own filtering
              // in this example we use fuse.js with support for fuzzy search
              onFilter: (items, query) => {
                if (!query) {
                  return items
                }
                const fuse = new Fuse(items, {
                  threshold: 0.2,
                  keys: ['name'],
                });
                return fuse.search(query)
              },
            }),
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
        query: null,
        suggestionRange: null,
        filteredUsers: [],
        navigatedUserIndex: 0,
        insertMention: () => {
        },
        observer: null,
      }
    },
    computed: {
      editor_content() {
        return this.editor.getHTML()
      },
      hasResults() {
        return this.filteredUsers.length
      },
      showSuggestions() {
        return this.query || this.hasResults
      },
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
            const {empty} = this.editor.state.tr.selection;
            if (empty) {
              // show popup to enter text and link
              const text = prompt('Enter text to link:');
              if (text) {
                const link = this.showLinkMenu();
                this.insertLinkToLastParagraph(text, link)
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
      insertLinkToLastParagraph(text, link) {
        const doc = this.editor.getJSON();
        const lastParagraph = doc.content[doc.content.length - 1];
        if (!lastParagraph.content) {
          Object.assign(lastParagraph, {content: []})
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
        });
        this.editor.setContent(doc)
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

      // navigate to the previous item
      // if it's the first item, navigate to the last one
      upHandler() {
        this.navigatedUserIndex = ((this.navigatedUserIndex + this.filteredUsers.length) - 1) % this.filteredUsers.length
      },
      // navigate to the next item
      // if it's the last item, navigate to the first one
      downHandler() {
        this.navigatedUserIndex = (this.navigatedUserIndex + 1) % this.filteredUsers.length
      },
      enterHandler() {
        const user = this.filteredUsers[this.navigatedUserIndex];
        if (user) {
          this.selectUser(user)
        }
      },
      // we have to replace our suggestion text with a mention
      // so it's important to pass also the position of your suggestion text
      selectUser(user) {
        this.insertMention({
          range: this.suggestionRange,
          attrs: {
            id: user.id,
            label: user.name,
          },
        });
        // const pre = window.__ROUTER_MODE__ === "hash" ? "\\#" : "";
        // this.insertLinkToLastParagraph(`@${user.name}`, `${pre}/u/${user.name}`)
        this.editor.focus()
      },
      // renders a popup with suggestions
      // tiptap provides a virtualNode object for using popper.js (or tippy.js) for popups
      renderPopup(node) {
        if (this.popup) {
          return
        }
        this.popup = tippy(node, {
          content: this.$refs.suggestions,
          trigger: 'mouseenter',
          interactive: true,
          theme: 'dark',
          placement: 'top-start',
          inertia: true,
          duration: [400, 200],
          showOnInit: true,
          arrow: true,
          arrowType: 'round',
        });
        // we have to update tippy whenever the DOM is updated
        if (MutationObserver) {
          this.observer = new MutationObserver(() => {
            this.popup.popperInstance.scheduleUpdate()
          });
          this.observer.observe(this.$refs.suggestions, {
            childList: true,
            subtree: true,
            characterData: true,
          })
        }
      },
      destroyPopup() {
        if (this.popup) {
          this.popup.destroy();
          this.popup = null
        }
        if (this.observer) {
          this.observer.disconnect()
        }
      },
    },
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

  .mention {
    background: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.6);
    font-size: 0.8rem;
    font-weight: bold;
    border-radius: 5px;
    padding: 0.2rem 0.5rem;
    white-space: nowrap;
  }

  .mention-suggestion {
    color: rgba(0, 0, 0, 0.6);
  }

  .suggestion-list {
    padding: 0.2rem;
    border: 2px solid rgba(0, 0, 0, 0.1);
    font-size: 0.8rem;
    font-weight: bold;
  }

  .suggestion-list__no-results {
    padding: 0.2rem 0.5rem;
  }

  .suggestion-list__item {
    border-radius: 5px;
    padding: 0.2rem 0.5rem;
    margin-bottom: 0.2rem;
    cursor: pointer;
  }

  .suggestion-list__item:last-child {
    margin-bottom: 0;
  }

  .suggestion-list__item.is-selected, .suggestion-list__item:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .suggestion-list__item.is-empty {
    opacity: 0.5;
  }

  .tippy-tooltip.dark-theme {
    background-color: #000;
    padding: 0;
    font-size: 1rem;
    text-align: inherit;
    color: #fff;
    border-radius: 5px;
  }

  .tippy-tooltip.dark-theme .tippy-backdrop {
    display: none;
  }

  .tippy-tooltip.dark-theme .tippy-roundarrow {
    fill: #000;
  }

  .tippy-popper[x-placement^=top] .tippy-tooltip.dark-theme .tippy-arrow {
    border-top-color: #000;
  }

  .tippy-popper[x-placement^=bottom] .tippy-tooltip.dark-theme .tippy-arrow {
    border-bottom-color: #000;
  }

  .tippy-popper[x-placement^=left] .tippy-tooltip.dark-theme .tippy-arrow {
    border-left-color: #000;
  }

  .tippy-popper[x-placement^=right] .tippy-tooltip.dark-theme .tippy-arrow {
    border-right-color: #000;
  }

</style>
