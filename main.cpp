#include<iostream>
#include<string>
#include<vector>
using namespace std;
struct Book{
    int id;
    string author;
    string bookname;
    bool isIssued=false;
};
class library{
     vector<Book>books;
     public:
     void addBooks(int id,string author,string bookname){
        books.push_back({id,author,bookname});
        cout<<"Book added succesfully\n";

     }
     void showBooks(){
        if(books.empty()){
            cout<<"There is no book in library"<<endl;
            return;
        }
            for(auto &b:books){
                cout<<"Book id:"<<b.id<<"||"<<"Author:"<<b.author<<"||"<<"BookName:"<<b.bookname<<"||"<<"status:"<<(b.isIssued?"Issued":"Available")<<endl ;
            }
        }
        void deleteBooks(int id){
            for(auto b=books.begin();b!=books.end();b++){
                if(b->id==id){
                    cout<<"Book Named:"<<b->bookname<<"deleted"<<endl;
                    books.erase(b);
                    return;
                }
            }
            cout<<"Book not found"<<endl;
        }
        void searchBookById(int id){
            for(auto &b:books){
                if(b.id==id){
                    cout<<"Book name is:"<<b.bookname<<"and author is"<<b.author<<endl;
                    return;
                }
            }
            cout<<"Book Not found"<<endl;
        }
        void searchBookByName(string author){
            for(auto &b:books){
                if(b.author==author){
                    cout<<"Book name is:"<<b.bookname<<endl;
                    return;
                }
            }
            cout<<"Book not found"<<endl;
        }
        void updateBook(int id){
            for(auto &b:books){
                if(b.id==id){
                    cout<<"the book name is: "<<b.bookname<<" and author is: "<<b.author<<endl;
                    cout<<"Enter the new author:";
                    getline(cin,b.author);
                    cout<<"Enter the boook name: ";
                    getline(cin,b.bookname);
                    cout<<"Updated succesfully";
                    return;
                }
            }
            cout<<"Boook id is not present\n";
        }
        void borrow(int id){
            for(auto &b:books){
                if(b.id==id){
                    if(!b.isIssued){
                        b.isIssued=true;
                        cout<<"You borrowed "<<""<<b.bookname<<"  succesfully!"<<endl;
                    }else{
                        cout<<"The book is already borrowed\n";
                    }
                    return;
                }
                }
                cout<<"book is not there\n";
            
        }
        void returnBook(int id){
            for(auto &b:books){
                if(b.id==id){
                    if(b.isIssued){
                        b.isIssued=false;
                        cout<<"You returned "<<""<<b.bookname<<"succesfully!\n";
                    }else{
                        cout<<"book not borrowed\n";
                    }
                    return;
                }
            }
            cout<<"the book not found\n";
        }
    
};
int main(){
    library lib;
   int choice;
   while(true){
    cout<<"1.Add Book\n";
    cout<<"2.Show Books\n";
    cout<<"3.delete Books\n";
    cout<<"4.search book by id\n";
    cout<<"5.search book by author name\n";
    cout<<"6.update\n";
    cout<<"7.BorrowBook\n";
    cout<<"8.returnBook\n";
    cout<<"9.Exit\n";
    cout<<"Enter your choice:";
    cin>>choice;
    if(choice==1){
        int id;
        string author,bookname;
        cout<<"ID:";
        cin>>id;
        cin.ignore();
        cout<<"author:";
        getline(cin,author);
        cout<<"book name:";
        getline(cin,bookname);
        lib.addBooks(id,author,bookname);
    }else if(choice==2){
        lib.showBooks();
    }else if(choice==3){
        int id;
        cout<<"Enter id:"<<endl;
        cin>>id;
        lib.deleteBooks(id);
    }else if(choice==4){
        int id;
        cout<<"Enter book id:";
        cin>>id;
       lib.searchBookById(id);
    }else if(choice==5){
       string author;
       cout<<"Enter author name:";
       cin>>author;
       lib.searchBookByName(author);
    }
    else if(choice==6){
        int id;
        cout<<"Enter id";
        cin>>id;
        cin.ignore();
        lib.updateBook(id);
    }
    else if(choice ==7){
       int id;
       cout<<"Enter the id of the book:";
       cin>>id;
       lib.borrow(id);
    }else if(choice==8){
         int id;
         cout<<"Enter the book id:\n";
         cin>>id;
         lib.returnBook(id);
    }
    else if(choice==9){
        cout<<"Exiting...\n";
        break;
    }else{
        cout<<"Invalid\n";
    }
   }
    return 0;
}