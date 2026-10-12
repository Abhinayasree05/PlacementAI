// data/codingProblems.ts
// Real DSA problem bank for the Coding Agent, grouped by topic.
//
// Phase A structure: adds examples[], publicTestCases, hiddenTestCases,
// starterCode, and an `executable` flag, in preparation for real Python
// execution via Piston (not implemented yet — see Phase C).
//
// IMPORTANT: every publicTestCases/hiddenTestCases pair below was hand
// -verified against the problem's actual logic before being written in.
// Where a problem could not be reduced to a reliable, unambiguous single
// stdin -> stdout contract (e.g. because valid outputs can have more
// than one correct ordering, or because it's fundamentally a multi
// -operation data-structure design problem rather than a single
// input/output function), it is marked `executable: false` with an
// explanation in a comment above it, rather than faking test data.

export type Difficulty = "Easy" | "Medium" | "Hard";
export type SupportedLanguage = "python";

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: string; // literal stdin fed to the program
  expectedOutput: string; // literal stdout, compared after trimming whitespace
}

export interface CodingProblem {
  id: string;
  topic: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string;
  ioNote: string;
  examples: Example[];
  publicTestCases: TestCase[];
  hiddenTestCases: TestCase[];
  starterCode: Partial<Record<SupportedLanguage, string>>;
  executable: boolean;
}

export const CODING_TOPICS = [
  "Arrays",
  "Strings",
  "Recursion",
  "Sorting",
  "Searching",
  "Linked List",
  "Stack & Queue",
  "Trees",
] as const;

export type CodingTopic = (typeof CODING_TOPICS)[number];

// ---------------------------------------------------------------------
// Shared Python starter helpers, inlined per-problem so each starter
// snippet is fully self-contained and runnable on its own via Piston.
// ---------------------------------------------------------------------

const LIST_NODE_HELPERS = `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(values):
    dummy = ListNode()
    curr = dummy
    for v in values:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def print_list(head):
    vals = []
    while head:
        vals.append(str(head.val))
        head = head.next
    print(" ".join(vals))
`;

const TREE_NODE_HELPERS = `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(values):
    if not values or values[0] == "N":
        return None
    root = TreeNode(int(values[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values) and values[i] != "N":
            node.left = TreeNode(int(values[i]))
            queue.append(node.left)
        i += 1
        if i < len(values) and values[i] != "N":
            node.right = TreeNode(int(values[i]))
            queue.append(node.right)
        i += 1
    return root
`;

export const CODING_PROBLEMS: Record<CodingTopic, CodingProblem[]> = {
  Arrays: [
    {
      id: "arr1", topic: "Arrays", title: "Two Sum", difficulty: "Easy",
      description: "Given an array of integers and a target, return the indices of the two numbers that add up to the target.",
      constraints: "Each input has exactly one solution. You may not use the same element twice.",
      ioNote: "Read a line of space-separated integers as the array, then a line with the target integer. Print the two 0-indexed positions separated by a space.",
      examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]" }],
      publicTestCases: [{ input: "2 7 11 15\n9", expectedOutput: "0 1" }],
      hiddenTestCases: [
        { input: "3 2 4\n6", expectedOutput: "1 2" },
        { input: "3 3\n6", expectedOutput: "0 1" },
      ],
      starterCode: {
        python: `def two_sum(nums, target):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    target = int(input())
    result = two_sum(nums, target)
    print(*result)
`,
      },
      executable: true,
    },
    {
      id: "arr2", topic: "Arrays", title: "Maximum Subarray", difficulty: "Medium",
      description: "Find the contiguous subarray with the largest sum and return that sum.",
      constraints: "Array length >= 1.",
      ioNote: "Read a line of space-separated integers (the array). Print the maximum subarray sum as a single integer.",
      examples: [{ input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" }],
      publicTestCases: [{ input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6" }],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "-1 -2 -3", expectedOutput: "-1" },
      ],
      starterCode: {
        python: `def max_subarray(nums):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    print(max_subarray(nums))
`,
      },
      executable: true,
    },
    {
      id: "arr3", topic: "Arrays", title: "Move Zeroes", difficulty: "Easy",
      description: "Move all zeroes in the array to the end while maintaining the relative order of non-zero elements, in-place.",
      constraints: "Do this without making a copy of the array.",
      ioNote: "Read a line of space-separated integers. Print the array after moving all zeroes to the end, preserving relative order of non-zero elements, space-separated.",
      examples: [{ input: "nums = [0,1,0,3,12]", output: "[1,3,12,0,0]" }],
      publicTestCases: [{ input: "0 1 0 3 12", expectedOutput: "1 3 12 0 0" }],
      hiddenTestCases: [
        { input: "0 0 0", expectedOutput: "0 0 0" },
        { input: "1 2 3", expectedOutput: "1 2 3" },
      ],
      starterCode: {
        python: `def move_zeroes(nums):
    # TODO: write your solution (modify and return nums)
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    result = move_zeroes(nums)
    print(*result)
`,
      },
      executable: true,
    },
  ],

  Strings: [
    {
      id: "str1", topic: "Strings", title: "Valid Anagram", difficulty: "Easy",
      description: "Given two strings, determine if the second is an anagram of the first.",
      constraints: "Strings contain only lowercase letters.",
      ioNote: "Read two lines, each a lowercase string. Print True if the second is an anagram of the first, else False.",
      examples: [{ input: 's = "anagram", t = "nagaram"', output: "true" }],
      publicTestCases: [{ input: "anagram\nnagaram", expectedOutput: "True" }],
      hiddenTestCases: [
        { input: "rat\ncar", expectedOutput: "False" },
        { input: "a\na", expectedOutput: "True" },
      ],
      starterCode: {
        python: `def is_anagram(s, t):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    s = input()
    t = input()
    print(is_anagram(s, t))
`,
      },
      executable: true,
    },
    {
      id: "str2", topic: "Strings", title: "Longest Substring Without Repeating Characters", difficulty: "Medium",
      description: "Find the length of the longest substring without repeating characters.",
      constraints: "0 <= s.length <= 5 * 10^4.",
      ioNote: "Read a line containing the string. Print the length of the longest substring without repeating characters as a single integer.",
      examples: [{ input: 's = "abcabcbb"', output: "3" }],
      publicTestCases: [{ input: "abcabcbb", expectedOutput: "3" }],
      hiddenTestCases: [
        { input: "bbbbb", expectedOutput: "1" },
        { input: "pwwkew", expectedOutput: "3" },
      ],
      starterCode: {
        python: `def length_of_longest_substring(s):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    s = input()
    print(length_of_longest_substring(s))
`,
      },
      executable: true,
    },
    {
      id: "str3", topic: "Strings", title: "Valid Palindrome", difficulty: "Easy",
      description: "Given a string, determine if it is a palindrome, considering only alphanumeric characters and ignoring case.",
      constraints: "Consider an empty string a valid palindrome.",
      ioNote: "Read a line containing the string. Print True if it is a palindrome (ignoring non-alphanumeric characters and case), else False.",
      examples: [{ input: 's = "A man, a plan, a canal: Panama"', output: "true" }],
      publicTestCases: [{ input: "A man, a plan, a canal: Panama", expectedOutput: "True" }],
      hiddenTestCases: [
        { input: "race a car", expectedOutput: "False" },
        { input: "noon", expectedOutput: "True" },
      ],
      starterCode: {
        python: `def is_palindrome(s):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    s = input()
    print(is_palindrome(s))
`,
      },
      executable: true,
    },
  ],

  Recursion: [
    {
      id: "rec1", topic: "Recursion", title: "Factorial", difficulty: "Easy",
      description: "Write a recursive function to compute the factorial of a non-negative integer n.",
      constraints: "0 <= n <= 15.",
      ioNote: "Read a single integer n. Print n! (factorial) as an integer.",
      examples: [{ input: "n = 5", output: "120" }],
      publicTestCases: [{ input: "5", expectedOutput: "120" }],
      hiddenTestCases: [
        { input: "0", expectedOutput: "1" },
        { input: "10", expectedOutput: "3628800" },
      ],
      starterCode: {
        python: `def factorial(n):
    # TODO: write your solution (recursive)
    pass

if __name__ == "__main__":
    n = int(input())
    print(factorial(n))
`,
      },
      executable: true,
    },
    {
      id: "rec2", topic: "Recursion", title: "Fibonacci Number", difficulty: "Easy",
      description: "Compute the nth Fibonacci number recursively (with or without memoization).",
      constraints: "0 <= n <= 30.",
      ioNote: "Read a single integer n. Print the nth Fibonacci number, where F(0)=0 and F(1)=1.",
      examples: [{ input: "n = 6", output: "8" }],
      publicTestCases: [{ input: "6", expectedOutput: "8" }],
      hiddenTestCases: [
        { input: "0", expectedOutput: "0" },
        { input: "10", expectedOutput: "55" },
      ],
      starterCode: {
        python: `def fibonacci(n):
    # TODO: write your solution (recursive or memoized)
    pass

if __name__ == "__main__":
    n = int(input())
    print(fibonacci(n))
`,
      },
      executable: true,
    },
    // NOT executable: subset/power-set generation has many equally valid
    // output orderings depending on traversal strategy. Exact stdout
    // matching would unfairly fail correct solutions unless a canonical
    // output order is strictly enforced and documented — that hasn't
    // been designed carefully enough yet to guarantee reliably, so this
    // stays AI-review-only rather than risk a wrong "verified" test.
    {
      id: "rec3", topic: "Recursion", title: "Generate Subsets", difficulty: "Medium",
      description: "Given an array of unique integers, return all possible subsets (the power set) using recursion.",
      constraints: "1 <= nums.length <= 10.",
      ioNote: "Not execution-ready yet — see comment above.",
      examples: [{ input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }],
      publicTestCases: [],
      hiddenTestCases: [],
      starterCode: {},
      executable: false,
    },
  ],

  Sorting: [
    {
      id: "sort1", topic: "Sorting", title: "Implement Bubble Sort", difficulty: "Easy",
      description: "Implement bubble sort to sort an array of integers in ascending order.",
      constraints: "Implement without using built-in sort functions.",
      ioNote: "Read a line of space-separated integers. Print the sorted array (ascending), space-separated.",
      examples: [{ input: "arr = [5,1,4,2,8]", output: "[1,2,4,5,8]" }],
      publicTestCases: [{ input: "5 1 4 2 8", expectedOutput: "1 2 4 5 8" }],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "5 4 3 2 1", expectedOutput: "1 2 3 4 5" },
      ],
      starterCode: {
        python: `def bubble_sort(arr):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    arr = list(map(int, input().split()))
    result = bubble_sort(arr)
    print(*result)
`,
      },
      executable: true,
    },
    {
      id: "sort2", topic: "Sorting", title: "Merge Sort", difficulty: "Medium",
      description: "Implement merge sort to sort an array of integers in ascending order.",
      constraints: "Aim for O(n log n) time complexity.",
      ioNote: "Read a line of space-separated integers. Print the sorted array (ascending), space-separated.",
      examples: [{ input: "arr = [38,27,43,3,9,82,10]", output: "[3,9,10,27,38,43,82]" }],
      publicTestCases: [{ input: "38 27 43 3 9 82 10", expectedOutput: "3 9 10 27 38 43 82" }],
      hiddenTestCases: [
        { input: "2 1", expectedOutput: "1 2" },
        { input: "9 9 9", expectedOutput: "9 9 9" },
      ],
      starterCode: {
        python: `def merge_sort(arr):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    arr = list(map(int, input().split()))
    result = merge_sort(arr)
    print(*result)
`,
      },
      executable: true,
    },
    {
      id: "sort3", topic: "Sorting", title: "Sort Colors (Dutch National Flag)", difficulty: "Medium",
      description: "Given an array with values 0, 1, and 2, sort it in-place in a single pass.",
      constraints: "Solve without using a library sort, in one pass, O(1) extra space.",
      ioNote: "Read a line of space-separated integers, each 0, 1, or 2. Print the sorted array, space-separated.",
      examples: [{ input: "nums = [2,0,2,1,1,0]", output: "[0,0,1,1,2,2]" }],
      publicTestCases: [{ input: "2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2" }],
      hiddenTestCases: [
        { input: "0", expectedOutput: "0" },
        { input: "2 2 1 1 0 0", expectedOutput: "0 0 1 1 2 2" },
      ],
      starterCode: {
        python: `def sort_colors(nums):
    # TODO: write your solution (modify and return nums)
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    result = sort_colors(nums)
    print(*result)
`,
      },
      executable: true,
    },
  ],

  Searching: [
    {
      id: "search1", topic: "Searching", title: "Binary Search", difficulty: "Easy",
      description: "Given a sorted array and a target value, return the index of the target, or -1 if not found.",
      constraints: "Array is sorted in ascending order. O(log n) time required.",
      ioNote: "Read a line of space-separated sorted integers, then a line with the target integer. Print the index of the target, or -1 if not found.",
      examples: [{ input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" }],
      publicTestCases: [{ input: "-1 0 3 5 9 12\n9", expectedOutput: "4" }],
      hiddenTestCases: [
        { input: "-1 0 3 5 9 12\n2", expectedOutput: "-1" },
        { input: "5\n5", expectedOutput: "0" },
      ],
      starterCode: {
        python: `def binary_search(nums, target):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    target = int(input())
    print(binary_search(nums, target))
`,
      },
      executable: true,
    },
    {
      id: "search2", topic: "Searching", title: "Search in Rotated Sorted Array", difficulty: "Medium",
      description: "Given a rotated sorted array and a target, find the index of the target in O(log n) time.",
      constraints: "All values are unique.",
      ioNote: "Read a line of space-separated integers (rotated sorted array), then a line with the target integer. Print the index of the target, or -1 if not found.",
      examples: [{ input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" }],
      publicTestCases: [{ input: "4 5 6 7 0 1 2\n0", expectedOutput: "4" }],
      hiddenTestCases: [
        { input: "4 5 6 7 0 1 2\n3", expectedOutput: "-1" },
        { input: "1\n0", expectedOutput: "-1" },
      ],
      starterCode: {
        python: `def search_rotated(nums, target):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    target = int(input())
    print(search_rotated(nums, target))
`,
      },
      executable: true,
    },
    {
      id: "search3", topic: "Searching", title: "Find First and Last Position", difficulty: "Medium",
      description: "Given a sorted array and a target, find the starting and ending position of the target value.",
      constraints: "O(log n) time complexity required.",
      ioNote: "Read a line of space-separated sorted integers, then a line with the target integer. Print the first and last index of the target separated by a space, or -1 -1 if not found.",
      examples: [{ input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" }],
      publicTestCases: [{ input: "5 7 7 8 8 10\n8", expectedOutput: "3 4" }],
      hiddenTestCases: [
        { input: "5 7 7 8 8 10\n6", expectedOutput: "-1 -1" },
        { input: "1\n1", expectedOutput: "0 0" },
      ],
      starterCode: {
        python: `def find_first_last(nums, target):
    # TODO: write your solution, return [first, last]
    pass

if __name__ == "__main__":
    nums = list(map(int, input().split()))
    target = int(input())
    result = find_first_last(nums, target)
    print(result[0], result[1])
`,
      },
      executable: true,
    },
  ],

  "Linked List": [
    {
      id: "ll1", topic: "Linked List", title: "Reverse a Linked List", difficulty: "Easy",
      description: "Given the head of a singly linked list, reverse the list and return the new head.",
      constraints: "Solve iteratively and recursively if possible.",
      ioNote: "Read a line of space-separated integers representing the list. Print the reversed list, space-separated.",
      examples: [{ input: "1 -> 2 -> 3 -> 4 -> 5", output: "5 -> 4 -> 3 -> 2 -> 1" }],
      publicTestCases: [{ input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1" }],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "1 2", expectedOutput: "2 1" },
      ],
      starterCode: {
        python: `${LIST_NODE_HELPERS}
def reverse_list(head):
    # TODO: write your solution, return the new head
    pass

if __name__ == "__main__":
    values = list(map(int, input().split()))
    head = build_list(values)
    new_head = reverse_list(head)
    print_list(new_head)
`,
      },
      executable: true,
    },
    {
      id: "ll2", topic: "Linked List", title: "Detect Cycle in Linked List", difficulty: "Medium",
      description: "Given the head of a linked list, determine if it has a cycle, using O(1) extra space.",
      constraints: "Use Floyd's Tortoise and Hare algorithm.",
      ioNote: "Read a line of space-separated node values, then a line with pos (0-indexed position the tail connects to, forming a cycle; use -1 for no cycle). Print True if the list has a cycle, else False.",
      examples: [{ input: "head with a cycle", output: "true" }],
      publicTestCases: [{ input: "3 2 0 -4\n1", expectedOutput: "True" }],
      hiddenTestCases: [
        { input: "1 2\n0", expectedOutput: "True" },
        { input: "1\n-1", expectedOutput: "False" },
      ],
      starterCode: {
        python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def has_cycle(head):
    # TODO: write your solution (e.g. Floyd's Tortoise and Hare)
    pass

def build_list_with_cycle(values, pos):
    nodes = [ListNode(v) for v in values]
    for i in range(len(nodes) - 1):
        nodes[i].next = nodes[i + 1]
    if pos != -1 and nodes:
        nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None

if __name__ == "__main__":
    values = list(map(int, input().split()))
    pos = int(input())
    head = build_list_with_cycle(values, pos)
    print(has_cycle(head))
`,
      },
      executable: true,
    },
    {
      id: "ll3", topic: "Linked List", title: "Merge Two Sorted Lists", difficulty: "Easy",
      description: "Merge two sorted linked lists and return it as a new sorted list.",
      constraints: "Splice the nodes of the two lists together.",
      ioNote: "Read two lines, each a space-separated sorted list of integers. Print the merged sorted list, space-separated.",
      examples: [{ input: "l1 = 1->2->4, l2 = 1->3->4", output: "1->1->2->3->4->4" }],
      publicTestCases: [{ input: "1 2 4\n1 3 4", expectedOutput: "1 1 2 3 4 4" }],
      hiddenTestCases: [
        { input: "1 3\n2", expectedOutput: "1 2 3" },
        { input: "5 10\n1 2 20", expectedOutput: "1 2 5 10 20" },
      ],
      starterCode: {
        python: `${LIST_NODE_HELPERS}
def merge_two_lists(l1, l2):
    # TODO: write your solution, return the head of the merged list
    pass

if __name__ == "__main__":
    l1 = build_list(list(map(int, input().split())))
    l2 = build_list(list(map(int, input().split())))
    merged = merge_two_lists(l1, l2)
    print_list(merged)
`,
      },
      executable: true,
    },
  ],

  "Stack & Queue": [
    {
      id: "sq1", topic: "Stack & Queue", title: "Valid Parentheses", difficulty: "Easy",
      description: "Given a string containing '()[]{}', determine if the brackets are validly matched using a stack.",
      constraints: "Only these six characters appear in the string.",
      ioNote: "Read a line containing a string of only '()[]{}' characters. Print True if the brackets are validly matched, else False.",
      examples: [{ input: 's = "()[]{}"', output: "true" }],
      publicTestCases: [{ input: "()[]{}", expectedOutput: "True" }],
      hiddenTestCases: [
        { input: "(]", expectedOutput: "False" },
        { input: "([)]", expectedOutput: "False" },
      ],
      starterCode: {
        python: `def is_valid(s):
    # TODO: write your solution using a stack
    pass

if __name__ == "__main__":
    s = input()
    print(is_valid(s))
`,
      },
      executable: true,
    },
    // NOT executable: this is a multi-operation data-structure DESIGN
    // problem (push/pop/peek/empty as a sequence of calls), not a single
    // input -> single output function. A reliable stdin/stdout contract
    // for it needs an "operations + arguments" protocol (like LeetCode's
    // own judge uses) that hasn't been designed yet — faking a
    // single-shot test for a stateful class would misrepresent what's
    // actually being tested.
    {
      id: "sq2", topic: "Stack & Queue", title: "Implement Queue using Stacks", difficulty: "Medium",
      description: "Implement a FIFO queue using only two stacks.",
      constraints: "Only standard stack operations are allowed.",
      ioNote: "Not execution-ready yet — see comment above.",
      examples: [{ input: "push(1), push(2), peek()", output: "1" }],
      publicTestCases: [],
      hiddenTestCases: [],
      starterCode: {},
      executable: false,
    },
    // NOT executable: same reasoning as sq2 — Min Stack is a stateful
    // class with multiple operations (push/pop/top/getMin), not a single
    // input/output function.
    {
      id: "sq3", topic: "Stack & Queue", title: "Min Stack", difficulty: "Medium",
      description: "Design a stack that supports push, pop, top, and retrieving the minimum element in O(1).",
      constraints: "All operations must run in constant time.",
      ioNote: "Not execution-ready yet — see comment above.",
      examples: [{ input: "push(-2), push(0), push(-3), getMin()", output: "-3" }],
      publicTestCases: [],
      hiddenTestCases: [],
      starterCode: {},
      executable: false,
    },
  ],

  Trees: [
    {
      id: "tree1", topic: "Trees", title: "Maximum Depth of Binary Tree", difficulty: "Easy",
      description: "Given the root of a binary tree, return its maximum depth.",
      constraints: "Number of nodes in range [0, 10^4].",
      ioNote: "Read a line of space-separated values representing the tree in level order (use N for a null/missing node). Print the maximum depth as an integer.",
      examples: [{ input: "root = [3,9,20,null,null,15,7]", output: "3" }],
      publicTestCases: [{ input: "3 9 20 N N 15 7", expectedOutput: "3" }],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "1 N 2 N 3", expectedOutput: "3" },
      ],
      starterCode: {
        python: `${TREE_NODE_HELPERS}
def max_depth(root):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    values = input().split()
    root = build_tree(values)
    print(max_depth(root))
`,
      },
      executable: true,
    },
    {
      id: "tree2", topic: "Trees", title: "Validate Binary Search Tree", difficulty: "Medium",
      description: "Given the root of a binary tree, determine if it is a valid binary search tree.",
      constraints: "Node values are unique integers.",
      ioNote: "Read a line of space-separated values representing the tree in level order (N for null). Print True if it is a valid BST, else False.",
      examples: [{ input: "root = [2,1,3]", output: "true" }],
      publicTestCases: [{ input: "2 1 3", expectedOutput: "True" }],
      hiddenTestCases: [
        { input: "5 1 4 N N 3 6", expectedOutput: "False" },
        { input: "1", expectedOutput: "True" },
      ],
      starterCode: {
        python: `${TREE_NODE_HELPERS}
def is_valid_bst(root):
    # TODO: write your solution
    pass

if __name__ == "__main__":
    values = input().split()
    root = build_tree(values)
    print(is_valid_bst(root))
`,
      },
      executable: true,
    },
    {
      id: "tree3", topic: "Trees", title: "Level Order Traversal", difficulty: "Medium",
      description: "Given the root of a binary tree, return the level order traversal of its nodes' values.",
      constraints: "Return a list of lists, one per level.",
      ioNote: "Read a line of space-separated values representing the tree in level order (N for null). Print each level on its own line, values space-separated.",
      examples: [{ input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" }],
      publicTestCases: [{ input: "3 9 20 N N 15 7", expectedOutput: "3\n9 20\n15 7" }],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "1 2 3", expectedOutput: "1\n2 3" },
      ],
      starterCode: {
        python: `${TREE_NODE_HELPERS}
def level_order(root):
    # TODO: write your solution, return a list of lists of values
    pass

if __name__ == "__main__":
    values = input().split()
    root = build_tree(values)
    levels = level_order(root)
    for level in levels:
        print(*level)
`,
      },
      executable: true,
    },
  ],
};
