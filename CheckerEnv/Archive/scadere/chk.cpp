#include <fstream>

using namespace std;

ifstream fin1("scadere.in");
ifstream fin2("scadere.out");

int main()
{
    bool correct = true;

    long long dif;
    fin1 >> dif;

    long long a, b;
    fin2 >> a >> b;

    if(a != b + dif)
        correct = false;

    return !correct;
}